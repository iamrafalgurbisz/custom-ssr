# SSR from scratch

I created this website as an SSR learning project - I wanted to know how SSR really works under
the hood before jumping into Next.js. Everything a framework would normally do for me -
rendering, data loading, caching, routing - is written by hand here.

## Features

- Streaming SSR with Suspense (`renderToPipeableStream`) - the shell is sent immediately, slow
  sections stream in as their data resolves
- Deferred data - route loaders run on the server and their results are streamed as inline
  scripts that settle the promises pages read with `use()`
- Complete render (`onAllReady`) for bots and for the cache - fully resolved HTML with the right
  status code, 404 for unknown routes and missing products
- Redis cache for both rendered HTML and loader data - keys contain only the query params a route
  reads, only successful pages are cached, and concurrent requests for the same page share a
  single API call
- Client-side navigation after hydration - pages are swapped without a reload, and their data
  comes from the server as NDJSON, one line per loader (similar to the RSC payload in Next.js), so
  it goes through the same cache
- Code-splitting per route, with each page's JS and CSS preloaded from the manifest
- Static generation (SSG) for fully static routes (right now only index), built once at build
  time - no runtime render or cache needed
- Client-only components (e.g. cart) that never end up in the shared HTML cache
- Manual bot detection and request-scoped data fetching, without a meta-framework

## Encountered problems

- `renderToString` silently swallows `React.lazy` and Suspense - bot rendering path froze on
  "Loading comments..." instead of waiting; fixed by switching to `renderToPipeableStream` +
  `onAllReady`
- `React.lazy()` declared inside the component body instead of module scope - caused an
  unnecessary remount (and visible flicker) of the lazy component on every parent re-render
- Cache key bug: used `req.path` instead of `req.originalUrl` - pagination and filter query params
  collapsed onto the same cache entry, serving stale/wrong pages
- ...and then the opposite: with the full `originalUrl` as the key, anyone could fill Redis by
  adding random query strings; fixed by building keys from the pathname and only the query params
  the route actually reads
- Pages served from the cache flashed their Suspense fallback - the cached HTML was the recorded
  stream, which contains the fallback plus a script that swaps in the content later; fixed by
  caching a separate complete render instead
- Loader data was written into inline scripts with `JSON.stringify` - a `</script>` inside the data
  would end the script tag and allow XSS; fixed by serializing with `serialize-javascript` and
  escaping the page title
- `fetch` doesn't reject on 404, so a missing product looked like regular data; loaders now
  resolve to `null` for missing resources, which the server turns into a 404
- A streamed page can't answer 404 for a missing product - the status code goes out with the
  shell, before the data is known; only the complete render gets the right status
- Concurrent cache misses each called the API - an `await` between checking for an in-flight
  request and registering one let every request slip through the check
- Code-split pages broke the first paint - a lazy page suspends hydration at the root, and its CSS
  arrived only with its JS; fixed by loading the page chunk before hydrating and adding its CSS and
  JS links from the Vite manifest to the HTML
- Client-side navigation bypassed the cache - loaders ran in the browser, straight against the
  API; fixed with a server data endpoint, and by marking cached promises as fulfilled so `use()`
  reads them without showing the fallback for a frame
- Module scripts wait until the whole document is parsed - with streaming, that means until the
  slowest data arrives, and the page doesn't respond to input until then; fixed by loading the
  client entry with `async`, so hydration starts as soon as the shell is there and React hydrates
  the still-streaming Suspense boundaries as they arrive (better INP)

## Possible bugs / not implemented (deliberately omitted)

- Unknown categories aren't treated as missing - the API returns an empty list with 200, so every
  random `?category=` value still creates its own cache entry
- Cache invalidation is by TTL only - there's no way to purge a page when its data changes
- The cart has no real per-user data
- API responses aren't validated at runtime - their types are trusted, and routes' loaders aren't
  type-checked against the data their pages expect
- Client-side navigation is minimal - no scroll restoration on back, no loading indicator, no
  title updates, no focus management and no client-side data cache
- No per-page `<head>` - the title is just the path, with no meta description, Open Graph tags or
  canonical URL
- No compression and no `Cache-Control` headers - hashed assets could be cached forever, and
  gzip/brotli would need flushing on every chunk to keep streaming working
- Images come straight from the API's CDN, which sends `no-store` - no image proxy, resizing or
  browser caching; the font isn't subsetted either
- No responsive layout, no Content-Security-Policy and no automated tests

## Running

Development (Vite with HMR, cache disabled):

```sh
docker compose up app-dev
```

Production build (Redis cache enabled):

```sh
docker compose up app
```

Both serve the app on http://localhost:3000.

## Structure

| Path                   | What it does                                                              |
| ---------------------- | ------------------------------------------------------------------------- |
| `src/server.ts`        | Express server entry point                                                |
| `src/ssr/`             | Server-only code: request handlers, rendering, streaming, cache, template |
| `src/entry-server.tsx` | React rendering on the server (streamed and complete)                     |
| `src/entry-client.tsx` | Hydration                                                                 |
| `src/router.tsx`       | Client-side navigation                                                    |
| `src/routes.tsx`       | Routes, their pages and data loaders                                      |
| `src/api.ts`           | Product API ([dummyjson](https://dummyjson.com))                          |
| `scripts/prerender.ts` | Static generation of `/` at build time                                    |
