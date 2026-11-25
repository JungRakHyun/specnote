#!/usr/bin/env node
/**
 * SpecNote (스펙노트) — 새 포스트 + 매거진 인포그래픽 SVG 커버 자동 생성기
 */
import fs from 'node:fs';
import path from 'node:path';
import { generateInfographicSvg } from './generate-cover.mjs';

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : '';
}

const queuePath = path.resolve('content-queue.json');
let slug = getArg('slug');
let title = getArg('title');
let category = getArg('category') || 'ai-tools';
let affiliateType = getArg('affiliate') || 'none';
let tags = getArg('tags')
  ? getArg('tags').split(',').map((t) => t.trim()).filter(Boolean)
  : ['AI', '스펙비교'];

if (!slug && fs.existsSync(queuePath)) {
  const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  const queueItem = queue.find((item) => item.status === 'pending');
  if (queueItem) {
    slug = queueItem.slug;
    title = queueItem.title;
    category = queueItem.category;
    affiliateType = queueItem.affiliateType || 'none';
    tags = queueItem.tags || tags;
  }
}

if (!slug || !title) {
  console.error('사용법: npm run post:new -- --slug <slug> --title "<제목>" --category <ai-tools|dev-coding|tech-gear|automation>');
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const coverFile = `${slug}.svg`;
const coverRel = `/images/covers/${coverFile}`;
const coverAbs = path.resolve('public/images/covers', coverFile);
const postAbs = path.resolve('src/content/posts', `${slug}.mdx`);

const svg = generateInfographicSvg({ title, category, tags });
fs.mkdirSync(path.dirname(coverAbs), { recursive: true });
if (!fs.existsSync(coverAbs)) {
  fs.writeFileSync(coverAbs, svg, 'utf8');
  console.log(`🎨 매거진 인포그래픽 커버 생성 완료: ${coverRel}`);
}

if (fs.existsSync(postAbs)) {
  console.error(`⚠️ 이미 존재하는 포스트입니다: ${postAbs}`);
  process.exit(1);
}

const mdxTemplate = `---
title: "${title}"
description: "${title}에 대한 2026년 최신 공식 가격, 핵심 스펙, 장단점 및 실전 추천 가이드를 한눈에 정리했습니다."
pubDate: ${today}
updatedDate: ${today}
category: "${category}"
tags: ${JSON.stringify(tags)}
cover: "${coverRel}"
coverAlt: "${title} 비교 인포그래픽"
featured: false
draft: true
affiliateType: "${affiliateType}"
tldr:
  - "핵심 결론 1을 1문장으로 작성하세요."
  - "핵심 결론 2를 1문장으로 작성하세요."
  - "핵심 결론 3을 1문장으로 작성하세요."
faqs:
  - question: "자주 묻는 질문 1?"
    answer: "명확하고 객관적인 답변을 작성하세요."
  - question: "자주 묻는 질문 2?"
    answer: "명확하고 객관적인 답변을 작성하세요."
---

import Callout from '../../components/Callout.astro';
import AffiliateCard from '../../components/AffiliateCard.astro';
import AdSlot from '../../components/AdSlot.astro';

여기에 도입부를 작성하세요.

## 1. 핵심 비교표

| 항목 | 옵션 A | 옵션 B |
| :--- | :--- | :--- |
| 가격 | - | - |
| 핵심 강점 | - | - |

<AdSlot position="postInArticle" format="fluid" />

## 2. 상황별 추천 가이드

여기에 구체적인 추천 시나리오와 선택 기준을 작성하세요.
`;

fs.writeFileSync(postAbs, mdxTemplate, 'utf8');
console.log(`📝 새 포스트 초안 생성 완료: src/content/posts/${slug}.mdx`);
console.log('👉 본문 작성 후 frontmatter의 draft: false로 바꾸고 npm run publish 를 실행하세요.');
