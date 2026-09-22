import { renderToPipeableStream } from 'react-dom/server';
import { Writable } from 'node:stream';
import { Shell } from './components/Shell/Shell';
import { loadRoute, matchRoute, type RouteData } from './routes';

export { cacheKeyFor } from './routes';

export const routeFile = (url: string) => matchRoute(url)?.page.file;

export const loadData = (url: string): RouteData => loadRoute(url)?.data;

const App = ({ url, data }: { url: string; data: RouteData }) => {
  const route = loadRoute(url, data);

  return <Shell>{route ? <route.Component data={route.data} /> : <h1>404</h1>}</Shell>;
};

export function render(
  url: string,
  data: RouteData,
  options?: Parameters<typeof renderToPipeableStream>[1],
) {
  return renderToPipeableStream(<App url={url} data={data} />, options);
}

export function renderToHtml(
  url: string,
  data: RouteData,
): Promise<{ html: string; hadError: boolean }> {
  return new Promise((resolve, reject) => {
    let html = '';
    let hadError = false;

    const { pipe, abort } = renderToPipeableStream(<App url={url} data={data} />, {
      onAllReady() {
        const collector = new Writable({
          write(chunk, _enc, cb) {
            html += chunk.toString();
            cb();
          },
        });
        collector.on('finish', () => {
          clearTimeout(timeout);
          resolve({ html, hadError });
        });
        pipe(collector);
      },
      onShellError(err) {
        clearTimeout(timeout);
        reject(err);
      },
      onError(err) {
        hadError = true;
        console.error('Render error:', err);
      },
    });

    const timeout = setTimeout(() => {
      abort();
      reject(new Error('renderToHtml timeout'));
    }, 10_000);
  });
}
