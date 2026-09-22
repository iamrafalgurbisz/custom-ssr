import { isProd, TTL } from './env';
import { redis } from './redis';

export const getCache = (key: string) => (isProd ? redis.get(key) : Promise.resolve(null));

export const setCache = async (key: string, value: string) => {
  if (!isProd) return;

  await redis.set(key, value, { expiration: { value: TTL, type: 'EX' } });
};

export const htmlCacheKey = (key: string) => `html-cache:${key}`;

export const dataCacheKey = (key: string) => `data-cache:${key}`;
