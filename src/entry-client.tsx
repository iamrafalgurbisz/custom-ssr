import '@vitejs/plugin-react/preamble';

import { hydrateRoot } from 'react-dom/client';
import { Router } from './router';
import { matchRoute } from './routes';

const match = matchRoute(window.__URL__);
const loaderKeys = match?.deferred ? Object.keys(match.deferred) : [];
const data = Object.fromEntries(loaderKeys.map((key) => [key, window.__getDeferred__(key)]));

match?.page.load().then((Page) => {
  hydrateRoot(
    document.getElementById('root')!,
    <Router initial={{ url: window.__URL__, Page, data, push: false }} />,
  );
});
