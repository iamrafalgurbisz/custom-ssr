import fs from 'node:fs/promises';
import { renderToHtml, routeFile } from '../dist/server/entry-server.js';
import { pageAssetLinks, type Manifest } from '../src/ssr/pageAssets';
import { fillTemplate, wrapHtml } from '../src/ssr/template';

const STATIC_ROUTES = { '/': 'home' };

const main = async () => {
  const html = await fs.readFile('dist/client/index.html', 'utf-8');
  const manifest: Manifest = JSON.parse(
    await fs.readFile('dist/client/.vite/manifest.json', 'utf-8'),
  );

  await fs.mkdir('dist/client/static', { recursive: true });

  for (const [url, name] of Object.entries(STATIC_ROUTES)) {
    const template = fillTemplate(html, url, pageAssetLinks(manifest, routeFile(url)));
    const { html: appHtml } = await renderToHtml(url, undefined);
    const outPath = `dist/client/static/${name}.html`;

    await fs.writeFile(outPath, wrapHtml(template, appHtml), 'utf-8');

    console.log(`✓ Prerendered ${url} → ${outPath}`);
  }
};

main().catch((err) => {
  console.error('Prerender failed:', err);

  process.exit(1);
});
