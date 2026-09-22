import express from 'express';
import { createServer } from 'node:http';
import { isProd, port, TTL } from './ssr/env';
import { dataHandler } from './ssr/handlers/dataHandler';
import { pageHandler } from './ssr/handlers/pageHandler';
import { createSsr } from './ssr/runtime';

const app = express();
const httpServer = createServer(app);

const vite = isProd
  ? undefined
  : await (
      await import('vite')
    ).createServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: 'custom',
    });

if (vite) app.use(vite.middlewares);
app.use(express.static(isProd ? 'dist/client' : 'public', { index: false }));

const ssr = await createSsr(vite);

app.get('/__data', dataHandler(ssr));
app.use(pageHandler(ssr));

httpServer.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
  console.log(`ENV: ${isProd ? 'PROD' : 'DEV'}, TTL: ${TTL}`);
});
