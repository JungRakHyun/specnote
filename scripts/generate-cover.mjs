#!/usr/bin/env node
/**
 * SpecNote (스펙노트) — 매거진 인포그래픽 SVG 썸네일 자동 생성기
 * 향후 자동 발행되는 모든 포스트에 통일감 있는 고클릭률(CTR) 썸네일을 자동 생성합니다.
 */
import fs from 'node:fs';
import path from 'node:path';

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function splitHeadline(title) {
  const clean = title.trim();
  if (clean.includes(':')) {
    const [left, ...rest] = clean.split(':');
    const right = rest.join(':').trim();
    return [left.trim().slice(0, 22), right.slice(0, 24)];
  }
  if (clean.length <= 18) return [clean, '2026 핵심 비교 리포트'];
  const mid = Math.min(18, Math.floor(clean.length / 2));
  const spaceIdx = clean.lastIndexOf(' ', mid + 3);
  const cut = spaceIdx > 8 ? spaceIdx : mid;
  return [clean.slice(0, cut).trim(), clean.slice(cut).trim().slice(0, 24)];
}

export function generateInfographicSvg({
  title,
  category = 'ai-tools',
  tags = [],
  subtitle = '공식 스펙 · 최신 가격 · 실사용 기준 비교 정리',
}) {
  const themes = {
    'ai-tools': {
      label: 'AI 툴 비교',
      bg1: '#0B132B',
      bg2: '#172554',
      pill: '#2563EB',
      accent: '#60A5FA',
      sub: '#93C5FD',
    },
    'dev-coding': {
      label: 'AI 코딩 · 개발',
      bg1: '#0F172A',
      bg2: '#312E81',
      pill: '#4F46E5',
      accent: '#A5B4FC',
      sub: '#C7D2FE',
    },
    'tech-gear': {
      label: 'IT 기기 · 스펙',
      bg1: '#091118',
      bg2: '#064E3B',
      pill: '#059669',
      accent: '#34D399',
      sub: '#6EE7B7',
    },
    automation: {
      label: '업무 자동화',
      bg1: '#082F49',
      bg2: '#1E293B',
      pill: '#0284C7',
      accent: '#38BDF8',
      sub: '#7DD3FC',
    },
  };

  const t = themes[category] || themes['ai-tools'];
  const [line1, line2] = splitHeadline(title);
  const badgeItems = (tags.length > 0 ? tags : ['핵심 비교', '요금제 분석', '추천 가이드', 'FAQ']).slice(0, 4);

  const cardsSvg = badgeItems
    .map((tag, idx) => {
      const x = 72 + idx * 270;
      return `
  <rect x="${x}" y="424" width="246" height="172" rx="20" fill="#0F172A" fill-opacity="0.88" stroke="${t.accent}" stroke-opacity="0.55" stroke-width="2"/>
  <text x="${x + 26}" y="468" fill="${t.sub}" font-family="'Pretendard', 'Malgun Gothic', sans-serif" font-size="15" font-weight="800">POINT 0${idx + 1}</text>
  <text x="${x + 26}" y="520" fill="#FFFFFF" font-family="'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif" font-size="28" font-weight="900">#${escapeXml(tag.slice(0, 9))}</text>
  <text x="${x + 26}" y="560" fill="#94A3B8" font-family="'Pretendard', 'Malgun Gothic', sans-serif" font-size="15" font-weight="500">공식 스펙 · 실전 기준</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="675" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${t.bg1}"/>
      <stop offset="100%" stop-color="${t.bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.8" cy="0.25" r="0.5">
      <stop offset="0%" stop-color="${t.accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${t.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect width="1200" height="675" fill="url(#glow)"/>
  <g stroke="#334155" stroke-opacity="0.24">
    <path d="M0 168H1200M0 337H1200M0 506H1200"/>
    <path d="M300 0V675M600 0V675M900 0V675"/>
  </g>
  <rect x="72" y="58" width="164" height="40" rx="20" fill="${t.pill}"/>
  <text x="154" y="84" text-anchor="middle" fill="#FFFFFF" font-family="'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif" font-size="18" font-weight="800">${escapeXml(t.label)}</text>
  <rect x="250" y="58" width="154" height="40" rx="20" fill="#1E293B" stroke="${t.accent}" stroke-width="1.5"/>
  <text x="327" y="84" text-anchor="middle" fill="${t.sub}" font-family="'Pretendard', 'Malgun Gothic', sans-serif" font-size="16" font-weight="700">2026 리포트</text>
  <g transform="translate(962, 62)">
    <rect width="32" height="32" rx="8" fill="#FFFFFF" fill-opacity="0.12"/>
    <rect x="7" y="8" width="11" height="3.5" rx="1.75" fill="#FFFFFF"/>
    <rect x="7" y="14.5" width="18" height="3.5" rx="1.75" fill="#38BDF8"/>
    <rect x="7" y="21" width="14" height="3.5" rx="1.75" fill="#34D399"/>
    <text x="44" y="23" fill="#CBD5E1" font-family="'Pretendard', 'Malgun Gothic', sans-serif" font-size="19" font-weight="800" letter-spacing="1">SPECNOTE</text>
  </g>
  <text x="72" y="200" fill="#FFFFFF" font-family="'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif" font-size="58" font-weight="900" letter-spacing="-1.5">${escapeXml(line1)}</text>
  <text x="72" y="276" fill="${t.accent}" font-family="'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif" font-size="54" font-weight="900" letter-spacing="-1.2">${escapeXml(line2)}</text>
  <text x="72" y="336" fill="#94A3B8" font-family="'Pretendard', 'Malgun Gothic', sans-serif" font-size="24" font-weight="500">${escapeXml(subtitle)}</text>
  ${cardsSvg}
</svg>
`;
}

// CLI 직접 실행 지원
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const args = process.argv.slice(2);
  const get = (k) => {
    const i = args.indexOf(`--${k}`);
    return i !== -1 && args[i + 1] ? args[i + 1] : '';
  };
  const slug = get('slug');
  const title = get('title');
  if (!slug || !title) {
    console.error('사용법: node scripts/generate-cover.mjs --slug <slug> --title "<제목>" --category ai-tools --tags "태그1,태그2"');
    process.exit(1);
  }
  const svg = generateInfographicSvg({
    title,
    category: get('category') || 'ai-tools',
    tags: get('tags') ? get('tags').split(',').map((s) => s.trim()) : [],
  });
  const out = path.resolve('public/images/covers', `${slug}.svg`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, svg, 'utf8');
  console.log(`🎨 매거진 인포그래픽 썸네일 생성 완료: /images/covers/${slug}.svg`);
}
