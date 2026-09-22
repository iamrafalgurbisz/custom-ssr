import type { RouteData } from '../routes';
import { createDeferred } from './deferred';

export const fetchRouteData = (url: string, keys: string[]): RouteData => {
  if (!keys.length) return undefined;

  const deferreds = new Map(keys.map((key) => [key, createDeferred<unknown>()]));

  const read = async () => {
    const res = await fetch(`/__data?url=${encodeURIComponent(url)}`);
    if (!res.ok || !res.body) throw new Error(`Data request failed: HTTP ${res.status}`);

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += value;

      let newline;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (!line) continue;

        const message: { key: string; value?: unknown; error?: string } = JSON.parse(line);
        const deferred = deferreds.get(message.key);
        if ('error' in message) deferred?.reject(new Error(message.error));
        else deferred?.resolve(message.value);
      }
    }
  };

  read()
    .catch((err: unknown) => deferreds.forEach((d) => d.reject(err)))
    .finally(() => deferreds.forEach((d) => d.reject(new Error('No data received'))));

  return Object.fromEntries([...deferreds].map(([key, d]) => [key, d.promise]));
};
