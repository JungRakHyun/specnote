// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import remarkGfm from 'remark-gfm';

// 환경변수 또는 기본값으로 배포 URL/Base 자동 전환
// - 커스텀 도메인 / Cloudflare Pages: SITE_URL="https://yourdomain.com", BASE_PATH="/"
// - GitHub Pages 프로젝트 경로: SITE_URL="https://jungrakhyun.github.io", BASE_PATH="/techpick-blog"
const siteUrl = process.env.SITE_URL || 'https://jungrakhyun.github.io';
const basePath = process.env.BASE_PATH || '/';

export default defineConfig({
  site: siteUrl,
  base: basePath,
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/tags/'),
      changefreq: 'daily',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    processor: unified({
      gfm: false,
      remarkPlugins: [[remarkGfm, { singleTilde: false }]],
    }),
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: true,
    },
  },
});
