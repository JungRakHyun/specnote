import type { APIRoute } from 'astro';
import { withBase } from '../utils/url';

export const GET: APIRoute = () => {
  const baseRoot = withBase('/');
  const precacheUrls = [
    baseRoot,
    withBase('/favicon.svg'),
    withBase('/icons/icon-192.png'),
    withBase('/manifest.webmanifest'),
  ];

  const swSource = `// SpecNote PWA Service Worker (Network-First HTML + SWR Static Assets)
const CACHE_NAME = 'specnote-pwa-v1';
const PRECACHE_URLS = ${JSON.stringify(precacheUrls)};
const BASE_ROOT = ${JSON.stringify(baseRoot)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HTML 페이지 탐색: 온라인이면 최신 글 우선, 오프라인이면 이전에 읽은 캐시 반환
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match(BASE_ROOT)) || Response.error();
        })
    );
    return;
  }

  // 정적 자산(_astro, images, icons 등): 캐시 즉시 응답 + 백그라운드 갱신
  if (
    url.pathname.includes('/_astro/') ||
    url.pathname.includes('/images/') ||
    url.pathname.includes('/icons/') ||
    /\\.(css|js|svg|png|webp|jpg|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((res) => {
            if (res && res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || networkPromise;
      })
    );
  }
});
`;

  return new Response(swSource, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
};
