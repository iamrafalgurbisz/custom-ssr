import { startTransition, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type React from 'react';
import { matchRoute, type Page, type RouteData } from './routes';
import { fetchRouteData } from './utils/fetchRouteData';
import { Shell } from './components/Shell/Shell';

const DATA_WAIT_MS = 500;

const waitForData = (data: RouteData, ms: number) =>
  Promise.race([
    Promise.allSettled(Object.values(data ?? {})),
    new Promise((resolve) => setTimeout(resolve, ms)),
  ]);

interface RouteState {
  url: string;
  Page: Page;
  data: RouteData;
  push: boolean;
}

export const Router: React.FC<{ initial: RouteState }> = ({ initial }) => {
  const [route, setRoute] = useState(initial);
  const navigationId = useRef(0);

  useEffect(() => {
    const navigate = async (url: string, push: boolean) => {
      const match = matchRoute(url);
      if (!match) return window.location.assign(url);

      const id = ++navigationId.current;
      const data = fetchRouteData(url, Object.keys(match.deferred ?? {}));
      let Page: Page;
      try {
        [Page] = await Promise.all([match.page.load(), waitForData(data, DATA_WAIT_MS)]);
      } catch {
        return window.location.assign(url);
      }

      if (id !== navigationId.current) return;

      startTransition(() => setRoute({ url, Page, data, push }));
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const a = (e.target as Element).closest('a');
      if (!a || a.origin !== window.location.origin) return;
      if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;

      e.preventDefault();
      navigate(a.pathname + a.search, true);
    };

    const onPopState = () => navigate(window.location.pathname + window.location.search, false);

    document.addEventListener('click', onClick);
    window.addEventListener('popstate', onPopState);

    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  useLayoutEffect(() => {
    if (!route.push) return;
    window.history.pushState(null, '', route.url);
    window.scrollTo(0, 0);
  }, [route]);

  return (
    <Shell>
      <route.Page key={route.url} data={route.data} />
    </Shell>
  );
};
