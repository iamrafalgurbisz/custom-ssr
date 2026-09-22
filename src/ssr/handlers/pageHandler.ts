import type { Request, RequestHandler } from 'express';
import escapeHtml from 'escape-html';
import { getCache, htmlCacheKey } from '../cache';
import { isProd } from '../env';
import { loadFullPage, renderFullPage } from '../fullPage';
import { ERROR_PAGE, sendHtml } from '../http';
import { getRouteData } from '../routeData';
import type { Ssr } from '../runtime';
import { streamPage } from '../streamPage';

const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|crawling|facebookexternalhit|slurp|bingpreview|whatsapp|telegrambot/i;

const isBotRequest = (req: Request) => BOT_USER_AGENT_PATTERN.test(req.headers['user-agent'] ?? '');

export const pageHandler =
  (ssr: Ssr): RequestHandler =>
  async (req, res, next) => {
    const staticPage = ssr.staticPage(req.path);
    if (staticPage) return sendHtml(res, 200, staticPage);

    if (/\.[a-zA-Z0-9]+$/.test(req.path)) return next();

    try {
      const entry = await ssr.getEntry();
      const key = entry.cacheKeyFor(req.originalUrl);
      const url = key ?? req.path;

      const cachedHtml = key ? await getCache(htmlCacheKey(key)) : null;
      if (cachedHtml) return sendHtml(res, 200, cachedHtml);

      const template = await ssr.getTemplate(entry, url);

      if (!key) {
        const page = await renderFullPage(entry, url, undefined, template);

        return sendHtml(res, 404, page.html);
      }

      const fullPage = loadFullPage(entry, key, url, template);

      if (isBotRequest(req)) {
        const page = await fullPage;

        return page ? sendHtml(res, page.status, page.html) : sendHtml(res, 500, ERROR_PAGE);
      }

      const data = await getRouteData(entry, key, url);

      streamPage(req, res, entry, url, data, template);
    } catch (error) {
      ssr.fixStacktrace(error as Error);
      console.error('Page request error:', error);

      if (res.headersSent) return res.end();

      const stack = `<pre>${escapeHtml((error as Error).stack ?? '')}</pre>`;
      sendHtml(res, 500, isProd ? ERROR_PAGE : stack);
    }
  };
