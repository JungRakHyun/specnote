#!/usr/bin/env node
/**
 * IndexNow 자동 색인 요청 스크립트 (네이버·빙 등 검색엔진 즉시 크롤링 요청)
 * SITE_URL 및 INDEXNOW_KEY 환경변수가 설정된 경우에만 실행됩니다.
 */
import fs from 'node:fs';
import path from 'node:path';

const siteUrl = (process.env.SITE_URL || '').replace(/\/+$/, '');
const basePath = (process.env.BASE_PATH || '/').replace(/\/+$/, '');
const key = process.env.INDEXNOW_KEY || '';

if (!siteUrl || !key) {
  console.log('ℹ️  IndexNow 건너뜀 (SITE_URL 또는 INDEXNOW_KEY 미설정).');
  process.exit(0);
}

const postsDir = path.resolve('src/content/posts');
const slugs = fs
  .readdirSync(postsDir)
  .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
  .map((f) => f.replace(/\.(md|mdx)$/, ''));

const host = new URL(siteUrl).host;
const prefix = basePath === '' || basePath === '/' ? '' : basePath;
const urlList = [
  `${siteUrl}${prefix}/`,
  ...slugs.map((s) => `${siteUrl}${prefix}/posts/${s}/`),
];

const body = {
  host,
  key,
  keyLocation: `${siteUrl}${prefix}/${key}.txt`,
  urlList,
};

console.log(`🚀 IndexNow에 ${urlList.length}개 URL 색인 요청 중...`);
try {
  const res = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  console.log(`✅ IndexNow 응답 코드: ${res.status}`);
} catch (err) {
  console.warn(`⚠️ IndexNow 요청 실패: ${err.message}`);
}
