import type { RouteData } from '../routes';
import { fulfilled } from '../utils/deferred';
import { dataCacheKey, getCache, setCache } from './cache';
import type { Entry } from './runtime';

export const settle = (data: RouteData) =>
  Promise.all(
    Object.entries(data ?? {}).map(async ([key, promise]) => {
      const [result] = await Promise.allSettled([promise]);

      return [key, result] as const;
    }),
  );

const inflight = new Map<string, Promise<RouteData>>();

export const getRouteData = (entry: Entry, key: string, url: string): Promise<RouteData> => {
  const existing = inflight.get(key);
  if (existing) return existing;

  const loading = (async (): Promise<RouteData> => {
    const cached = await getCache(dataCacheKey(key));
    if (!cached) return entry.loadData(url);

    const values: Record<string, unknown> = JSON.parse(cached);

    return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, fulfilled(v)]));
  })();

  const cacheWhenSettled = async () => {
    const results = await settle(await loading);
    if (!results.length) return;

    const values: Record<string, unknown> = {};
    for (const [k, result] of results) {
      if (result.status === 'rejected' || result.value === null) return;
      values[k] = result.value;
    }

    await setCache(dataCacheKey(key), JSON.stringify(values));
  };

  inflight.set(key, loading);

  cacheWhenSettled()
    .catch((err: unknown) => console.error('Data cache error:', err))
    .finally(() => inflight.delete(key));

  return loading;
};
