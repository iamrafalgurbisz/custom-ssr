import type { Request, Response } from 'express';
import { Transform } from 'node:stream';
import type { RouteData } from '../routes';
import { ERROR_PAGE, sendHtml } from './http';
import { settle } from './routeData';
import type { Entry } from './runtime';
import { deferredScript, type PageTemplate } from './template';

const RENDER_TIMEOUT_MS = 30_000;

export const streamPage = (
  req: Request,
  res: Response,
  entry: Entry,
  url: string,
  data: RouteData,
  template: PageTemplate,
) => {
  let didError = false;
  let shellSent = false;
  const pendingScripts: string[] = [];

  const writeScript = (script: string) => {
    if (shellSent) res.write(script);
    else pendingScripts.push(script);
  };

  const { pipe, abort } = entry.render(url, data, {
    onShellReady() {
      res.statusCode = didError ? 500 : 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.write(template.htmlStart);
      pendingScripts.forEach((script) => res.write(script));
      shellSent = true;

      const toResponse = new Transform({
        transform(chunk, _encoding, callback) {
          if (res.write(chunk)) callback();
          else res.once('drain', callback);
        },
      });

      toResponse.on('finish', async () => {
        clearTimeout(timeout);
        await settle(data);
        res.end(template.htmlEnd);
      });

      pipe(toResponse);
    },
    onShellError(error) {
      clearTimeout(timeout);
      console.error('Shell error:', error);
      sendHtml(res, 500, ERROR_PAGE);
    },
    onError(error) {
      didError = true;
      console.error('SSR error:', error);
    },
  });

  for (const [key, promise] of Object.entries(data ?? {})) {
    Promise.allSettled([promise]).then(([result]) => writeScript(deferredScript(key, result)));
  }

  req.on('close', () => {
    if (res.writableEnded) return;

    clearTimeout(timeout);
    abort();
  });

  const timeout = setTimeout(() => {
    console.error('Render timeout:', url);
    abort();
  }, RENDER_TIMEOUT_MS);
};
