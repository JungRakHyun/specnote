import type { APIRoute } from 'astro';
import { SITE } from '../config/site';
import { absoluteUrl } from '../utils/url';

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = absoluteUrl('/sitemap-index.xml', site ?? SITE.url);
  const body = `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Yeti
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: ${sitemapUrl}
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
