import type { APIRoute } from 'astro';
import { SITE } from '../config/site';

export const GET: APIRoute = () => {
  const pubId = SITE.adsense.clientId
    ? SITE.adsense.clientId.replace(/^ca-/, '')
    : '';

  const content = pubId
    ? `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`
    : `# Google AdSense 승인 후 src/config/site.ts의 adsense.clientId를 입력하면 자동으로 ads.txt가 채워집니다.\n`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
