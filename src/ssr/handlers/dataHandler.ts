import type { RequestHandler } from 'express';
import { getRouteData } from '../routeData';
import type { Ssr } from '../runtime';
import { errorMessage } from '../template';

export const dataHandler =
  (ssr: Ssr): RequestHandler =>
  async (req, res) => {
    try {
      const url = typeof req.query.url === 'string' ? req.query.url : '';
      const entry = await ssr.getEntry();
      const key = url.startsWith('/') ? entry.cacheKeyFor(url) : null;
      if (!key) {
        res.status(404).json({ error: 'Unknown route' });

        return;
      }

      const data = await getRouteData(entry, key, key);

      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.flushHeaders();

      await Promise.all(
        Object.entries(data ?? {}).map(async ([key, promise]) => {
          const [result] = await Promise.allSettled([promise]);
          const line =
            result.status === 'fulfilled'
              ? { key, value: result.value }
              : { key, error: errorMessage(result.reason) };

          res.write(JSON.stringify(line) + '\n');
        }),
      );
      res.end();
    } catch (error) {
      console.error('Data request error:', error);

      if (res.headersSent) res.end();
      else res.status(500).json({ error: 'Internal Server Error' });
    }
  };
