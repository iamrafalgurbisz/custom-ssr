import fs from 'node:fs/promises';
import type { ViteDevServer } from 'vite';
import { pageAssetLinks, type Manifest } from './pageAssets';
import { fillTemplate, type PageTemplate } from './template';

export type Entry = typeof import('../entry-server');

const PROD_ENTRY = './server/entry-server.js';

export interface Ssr {
  getEntry(): Promise<Entry>;
  getTemplate(entry: Entry, url: string): Promise<PageTemplate>;
  staticPage(path: string): string | undefined;
  fixStacktrace(error: Error): void;
}

export const createSsr = async (vite?: ViteDevServer): Promise<Ssr> => {
  if (vite) {
    return {
      getEntry: async () => (await vite.ssrLoadModule('/src/entry-server.tsx')) as Entry,
      getTemplate: async (_entry, url) => {
        const html = await vite.transformIndexHtml(url, await fs.readFile('index.html', 'utf-8'));

        return fillTemplate(html, url, '');
      },
      staticPage: () => undefined,
      fixStacktrace: (error) => vite.ssrFixStacktrace(error),
    };
  }

  const entry: Entry = await import(/* @vite-ignore */ PROD_ENTRY);
  const html = await fs.readFile('dist/client/index.html', 'utf-8');
  const manifest: Manifest = JSON.parse(
    await fs.readFile('dist/client/.vite/manifest.json', 'utf-8'),
  );
  const home = await fs.readFile('dist/client/static/home.html', 'utf-8').catch(() => undefined);

  return {
    getEntry: async () => entry,
    getTemplate: async (entry, url) =>
      fillTemplate(html, url, pageAssetLinks(manifest, entry.routeFile(url))),
    staticPage: (path) => (path === '/' ? home : undefined),
    fixStacktrace: () => {},
  };
};
