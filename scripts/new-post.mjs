#!/usr/bin/env node
/**
 * SpecNote (스펙노트) — 새 포스트 + 에디토리얼 SVG 커버 자동 생성기
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
  console.log(`🎨 에디토리얼 커버 생성 완료: ${coverRel}`);
}

if (fs.existsSync(postAbs)) {
  console.error(`⚠️ 이미 존재하는 포스트입니다: ${postAbs}`);
  process.exit(1);
}

const mdxTemplate = `---
title: "${title}"
description: "${title} — 2026년 공식 가격, 핵심 스펙 차이, 실제 사용 시 한계와 선택 기준을 검증했습니다."
pubDate: ${today}
updatedDate: ${today}
category: "${category}"
tags: ${JSON.stringify(tags)}
cover: "${coverRel}"
coverAlt: "${title} 스펙 비교 커버"
featured: false
draft: true
affiliateType: "${affiliateType}"
tldr:
  - "수치나 기준점이 들어간 핵심 결론 1"
  - "숨겨진 한계나 함정이 드러나는 결론 2"
  - "구체적 상황별 추천 결론 3"
faqs:
  - question: "구매·설치 직전에 실제로 가장 많이 헷갈리는 예/아니오 질문 1?"
    answer: "네/아니요/불가능합니다 등 질문에 대한 직답 결론으로 첫 문장을 시작한 뒤, 구체적 근거와 대안을 설명하세요."
  - question: "자주 겪는 문제나 한계에 대한 질문 2?"
    answer: "질문의 핵심을 피하지 말고 결론부터 명확하게 답한 뒤 해결 방법을 제시하세요."
  - question: "비용·호환성 관련 실전 질문 3?"
    answer: "수치와 기준을 포함해 직답으로 정리하세요."
---

import Callout from '../../components/Callout.astro';
import AffiliateCard from '../../components/AffiliateCard.astro';
import AdSlot from '../../components/AdSlot.astro';

첫 2문장 안에 핵심 결론이나 독자가 자주 겪는 함정(스펙 착시, 숨겨진 요금 제한 등)을 바로 제시하세요.

## 1. 공식 스펙 · 실비용 비교 (${today.slice(0, 7)} 기준)

| 모델 / 서비스 | 확인 가격 | 핵심 스펙 | 놓치기 쉬운 제약 |
| :--- | :--- | :--- | :--- |
| 항목 A | - | - | - |
| 항목 B | - | - | - |

## 2. 선택 전에 꼭 따져야 할 한계와 함정

여기에 "이럴 땐 사지 마세요" 또는 실사용에서 막히는 조건을 구체적으로 작성하세요.

<AdSlot position="postInArticle" format="fluid" />

## 3. 실전 세팅 · 트러블슈팅 체크리스트

여기에 바로 복사해서 쓸 수 있는 설정, 계산 공식, Before/After 예시를 작성하세요.

## 참고 출처

- 공식 출처 링크를 최소 2개 이상 기재하세요.
`;

fs.writeFileSync(postAbs, mdxTemplate, 'utf8');
console.log(`📝 새 포스트 초안 생성 완료: src/content/posts/${slug}.mdx`);
console.log('👉 BLOG_AUTOMATION.md의 탈(脫)AI 에디토리얼 원칙에 맞춰 본문을 완성한 뒤 draft: false로 바꾸고 npm run publish 를 실행하세요.');
