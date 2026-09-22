import { lazy } from 'react';
import type React from 'react';
import { fetchProduct, fetchProducts } from './api';

export type RouteParams = Record<string, string>;
export type RouteContext = { params: RouteParams; query: URLSearchParams };
type Loader = (ctx: RouteContext) => Promise<unknown>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Page = React.ComponentType<any>;
export type RouteData = Record<string, Promise<unknown>> | undefined;

const pageModules = import.meta.glob<Record<string, Page>>('./pages/*/*.tsx');

const page = (file: string, exportName: string) => {
  const load = () => pageModules[`./pages/${file}`]().then((m) => m[exportName]);

  return {
    file: `src/pages/${file}`,
    load,
    element: lazy(() => load().then((Component) => ({ default: Component }))),
  };
};

const defineRoute = (route: {
  path: RegExp;
  page: ReturnType<typeof page>;
  deferred?: Record<string, Loader>;
  query?: string[];
}) => route;

export const routes = [
  defineRoute({ path: /^\/$/, page: page('Main/Main.tsx', 'Main') }),
  defineRoute({ path: /^\/cart$/, page: page('Cart/Cart.tsx', 'Cart') }),
  defineRoute({
    path: /^\/products$/,
    page: page('Products/Products.tsx', 'Products'),
    query: ['category'],
    deferred: {
      products: ({ query }) => fetchProducts(query.get('category')),
    },
  }),
  defineRoute({
    path: /^\/product\/(?<id>\d+)$/,
    page: page('Product/Product.tsx', 'Product'),
    deferred: {
      product: ({ params }) => fetchProduct(Number(params.id)),
    },
  }),
];

export const matchRoute = (url: string) => {
  const { pathname, searchParams } = new URL(url, 'http://localhost');

  for (const r of routes) {
    const match = pathname.match(r.path);
    if (match) {
      return { ...r, params: (match.groups ?? {}) as RouteParams, searchParams };
    }
  }

  return null;
};

export const cacheKeyFor = (url: string) => {
  const match = matchRoute(url);
  if (!match) return null;

  const { pathname } = new URL(url, 'http://localhost');
  const query = new URLSearchParams();
  for (const name of match.query ?? []) {
    const value = match.searchParams.get(name);
    if (value !== null) query.set(name, value);
  }

  return query.size ? `${pathname}?${query}` : pathname;
};

type RouteMatch = NonNullable<ReturnType<typeof matchRoute>>;

const startLoaders = (match: RouteMatch): RouteData =>
  match.deferred &&
  Object.fromEntries(
    Object.entries(match.deferred).map(([key, load]) => [
      key,
      load({ params: match.params, query: match.searchParams }),
    ]),
  );

export const loadRoute = (url: string, preloaded?: RouteData) => {
  const match = matchRoute(url);
  if (!match) return null;

  return { Component: match.page.element, data: preloaded ?? startLoaders(match) };
};
