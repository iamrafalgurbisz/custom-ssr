import serialize from 'serialize-javascript';
import escapeHtml from 'escape-html';

export const json = (value: unknown) => serialize(value, { isJSON: true });

export const errorMessage = (reason: unknown) =>
  reason instanceof Error ? reason.message : String(reason);

const DEFERRED_RUNTIME = `
  window.__deferred__ = {};
  window.__getDeferred__ = function (key) {
    if (!window.__deferred__[key]) {
      let resolve, reject;
      const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
      window.__deferred__[key] = { promise, resolve, reject };
    }
    return window.__deferred__[key].promise;
  };
  window.__resolveDeferred__ = function (key, data) {
    window.__getDeferred__(key);
    window.__deferred__[key].resolve(data);
  };
  window.__rejectDeferred__ = function (key, message) {
    window.__getDeferred__(key);
    window.__deferred__[key].reject(new Error(message));
  };
`;

export const deferredScript = (key: string, result: PromiseSettledResult<unknown>) => {
  if (result.status === 'fulfilled') {
    return `<script>window.__resolveDeferred__(${json(key)}, ${json(result.value)});</script>`;
  }

  return `<script>window.__rejectDeferred__(${json(key)}, ${json(errorMessage(result.reason))});</script>`;
};

export interface PageTemplate {
  htmlStart: string;
  htmlEnd: string;
}

export const fillTemplate = (html: string, url: string, assetLinks: string): PageTemplate => {
  const { pathname } = new URL(url, 'http://localhost');
  const filled = html
    .replace('<!--app-title-->', () => escapeHtml(pathname))
    .replace('<!--page-assets-->', () => assetLinks)
    .replace(
      '<!--scripts-->',
      () => `<script>window.__URL__ = ${json(url)};${DEFERRED_RUNTIME}</script>`,
    );
  const [htmlStart, htmlEnd] = filled.split('<!--app-html-->');

  return { htmlStart, htmlEnd };
};

export const wrapHtml = (template: PageTemplate, appHtml: string, scripts = '') =>
  template.htmlStart + appHtml + template.htmlEnd.replace('</body>', () => scripts + '</body>');
