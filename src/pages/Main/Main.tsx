import type React from 'react';
import styles from './main.module.scss';

export const Main: React.FC = () => {
  return (
    <section className={styles.wrapper}>
      <div className={styles.section}>
        <span className={styles.sectionTitle}>ABOUT</span>
        <span>
          I created this website as an SSR learning project - I wanted to know how SSR really works
          under the hood before jumping into Next.js. Everything a framework would normally do for
          me - rendering, data loading, caching, routing - is written by hand here.
        </span>
      </div>
      <div className={styles.section}>
        <span className={styles.sectionTitle}>FEATURES</span>
        <ul>
          <li>
            Streaming SSR with Suspense (renderToPipeableStream) - the shell is sent immediately,
            slow sections stream in as their data resolves
          </li>
          <li>
            Deferred data - route loaders run on the server and their results are streamed as inline
            scripts that settle the promises pages read with use()
          </li>
          <li>
            Complete render (onAllReady) for bots and for the cache - fully resolved HTML with the
            right status code, 404 for unknown routes and missing products
          </li>
          <li>
            Redis cache for both rendered HTML and loader data - keys contain only the query params
            a route reads, only successful pages are cached, and concurrent requests for the same
            page share a single API call
          </li>
          <li>
            Client-side navigation after hydration - pages are swapped without a reload, and their
            data comes from the server as NDJSON, one line per loader (similar to the RSC payload in
            Next.js), so it goes through the same cache
          </li>
          <li>Code-splitting per route, with each page's JS and CSS preloaded from the manifest</li>
          <li>
            Static generation (SSG) for fully static routes (right now only index), built once at
            build time - no runtime render or cache needed
          </li>
          <li>Client-only components (e.g. cart) that never end up in the shared HTML cache</li>
          <li>Manual bot detection and request-scoped data fetching, without a meta-framework</li>
        </ul>
      </div>
      <div className={styles.section}>
        <span className={styles.sectionTitle}>ENCOUNTERED PROBLEMS</span>
        <ul>
          <li>
            renderToString silently swallows React.lazy and Suspense - bot rendering path froze on
            "Loading comments..." instead of waiting; fixed by switching to renderToPipeableStream +
            onAllReady
          </li>
          <li>
            React.lazy() declared inside the component body instead of module scope - caused an
            unnecessary remount (and visible flicker) of the lazy component on every parent
            re-render
          </li>
          <li>
            Cache key bug: used req.path instead of req.originalUrl - pagination and filter query
            params collapsed onto the same cache entry, serving stale/wrong pages
          </li>
          <li>
            ...and then the opposite: with the full originalUrl as the key, anyone could fill Redis
            by adding random query strings; fixed by building keys from the pathname and only the
            query params the route actually reads
          </li>
          <li>
            Pages served from the cache flashed their Suspense fallback - the cached HTML was the
            recorded stream, which contains the fallback plus a script that swaps in the content
            later; fixed by caching a separate complete render instead
          </li>
          <li>
            Loader data was written into inline scripts with JSON.stringify - a "&lt;/script&gt;"
            inside the data would end the script tag and allow XSS; fixed by serializing with
            serialize-javascript and escaping the page title
          </li>
          <li>
            fetch doesn't reject on 404, so a missing product looked like regular data; loaders now
            resolve to null for missing resources, which the server turns into a 404
          </li>
          <li>
            A streamed page can't answer 404 for a missing product - the status code goes out with
            the shell, before the data is known; only the complete render gets the right status
          </li>
          <li>
            Concurrent cache misses each called the API - an await between checking for an in-flight
            request and registering one let every request slip through the check
          </li>
          <li>
            Code-split pages broke the first paint - a lazy page suspends hydration at the root, and
            its CSS arrived only with its JS; fixed by loading the page chunk before hydrating and
            adding its CSS and JS links from the Vite manifest to the HTML
          </li>
          <li>
            Client-side navigation bypassed the cache - loaders ran in the browser, straight against
            the API; fixed with a server data endpoint, and by marking cached promises as fulfilled
            so use() reads them without showing the fallback for a frame
          </li>
          <li>
            Module scripts wait until the whole document is parsed - with streaming, that means
            until the slowest data arrives, and the page doesn't respond to input until then; fixed
            by loading the client entry with `async`, so hydration starts as soon as the shell is
            there and React hydrates the still-streaming Suspense boundaries as they arrive (better
            INP)
          </li>
        </ul>
      </div>
      <div className={styles.section}>
        <span className={styles.sectionTitle}>
          POSSIBLE BUGS / NOT IMPLEMENTED (DELIBERATELY OMITTED)
        </span>
        <ul>
          <li>
            Unknown categories aren't treated as missing - the API returns an empty list with 200,
            so every random ?category= value still creates its own cache entry
          </li>
          <li>
            Cache invalidation is by TTL only - there's no way to purge a page when its data changes
          </li>
          <li>The cart has no real per-user data</li>
          <li>
            API responses aren't validated at runtime - their types are trusted, and routes' loaders
            aren't type-checked against the data their pages expect
          </li>
          <li>
            Client-side navigation is minimal - no scroll restoration on back, no loading indicator,
            no title updates, no focus management and no client-side data cache
          </li>
          <li>
            No per-page &lt;head&gt; - the title is just the path, with no meta description, Open
            Graph tags or canonical URL
          </li>
          <li>
            No compression and no Cache-Control headers - hashed assets could be cached forever, and
            gzip/brotli would need flushing on every chunk to keep streaming working
          </li>
          <li>
            Images come straight from the API's CDN, which sends no-store - no image proxy, resizing
            or browser caching; the font isn't subsetted either
          </li>
          <li>No responsive layout, no Content-Security-Policy and no automated tests</li>
        </ul>
      </div>
    </section>
  );
};
