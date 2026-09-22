import type { RouteData } from '../routes';
import { htmlCacheKey, setCache } from './cache';
import { getRouteData, settle } from './routeData';
import type { Entry } from './runtime';
import { deferredScript, wrapHtml, type PageTemplate } from './template';

export interface FullPage {
  html: string;
  status: number;
}

export const renderFullPage = async (
  entry: Entry,
  url: string,
  data: RouteData,
  template: PageTemplate,
): Promise<FullPage> => {
  const results = await settle(data);
  const { html, hadError } = await entry.renderToHtml(url, data);

  const scripts = results.map(([key, result]) => deferredScript(key, result)).join('');
  const notFound = results.some(([, r]) => r.status === 'fulfilled' && r.value === null);

  return {
    html: wrapHtml(template, html, scripts),
    status: hadError ? 500 : notFound ? 404 : 200,
  };
};

const inflight = new Map<string, Promise<FullPage | null>>();

export const loadFullPage = (entry: Entry, key: string, url: string, template: PageTemplate) => {
  const existing = inflight.get(key);
  if (existing) return existing;

  const page = getRouteData(entry, key, url)
    .then((data) => renderFullPage(entry, url, data, template))
    .then(async (page) => {
      if (page.status === 200) await setCache(htmlCacheKey(key), page.html);

      return page;
    })
    .catch((err: unknown) => {
      console.error('Full page render error:', err);

      return null;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, page);

  return page;
};
