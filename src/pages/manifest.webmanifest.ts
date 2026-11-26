import type { APIRoute } from 'astro';
import { SITE } from '../config/site';
import { withBase } from '../utils/url';

export const GET: APIRoute = () => {
  const startUrl = withBase('/');
  const manifest = {
    id: startUrl,
    name: `${SITE.koName} (${SITE.name}) — ${SITE.tagline}`,
    short_name: SITE.koName,
    description: SITE.description,
    lang: 'ko-KR',
    start_url: startUrl,
    scope: startUrl,
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait-primary',
    background_color: '#F8F9FB',
    theme_color: '#0F172A',
    categories: ['technology', 'news', 'productivity'],
    icons: [
      {
        src: withBase('/icons/icon-192.png'),
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: withBase('/icons/icon-512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: withBase('/icons/icon-maskable-512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
    },
  });
};
