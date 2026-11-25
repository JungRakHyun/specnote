#!/usr/bin/env node
/**
 * SpecNote (스펙노트) — 미니멀 에디토리얼 매거진 SVG 썸네일 생성기
 * 카테고리별 고유 그래픽 모티프 + 깔끔한 타이포그래피 중심 구성
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 시각적 폭 근사치 계산 (한글/CJK 1.8, 영문/숫자 1.0, 공백 0.55) */
function visualWidth(str) {
  let w = 0;
  for (const ch of str) {
    if (/\s/.test(ch)) w += 0.55;
    else if (/[가-힣ㄱ-ㅎㅏ-ㅣ\u3000-\u9FFF]/.test(ch)) w += 1.8;
    else w += 1.0;
  }
  return w;
}

/** 단어 경계에서만 안전하게 줄임 */
function trimAtWordBoundary(str, maxVisual) {
  const clean = str.trim();
  if (visualWidth(clean) <= maxVisual) return clean;
  const words = clean.split(/\s+/);
  let out = '';
  for (const word of words) {
    const candidate = out ? `${out} ${word}` : word;
    if (visualWidth(candidate) <= maxVisual) {
      out = candidate;
    } else {
      break;
    }
  }
  return out || clean;
}

function splitHeadline(title) {
  const clean = title.trim();
  if (clean.includes(':')) {
    const idx = clean.indexOf(':');
    const left = clean.slice(0, idx).trim();
    const right = clean.slice(idx + 1).trim();
    return [trimAtWordBoundary(left, 36), trimAtWordBoundary(right, 40)];
  }
  if (visualWidth(clean) <= 24) {
    return [clean, '스펙 · 실비용 기준 검증 리포트'];
  }
  const words = clean.split(/\s+/);
  const target = visualWidth(clean) / 2;
  let line1 = '';
  let splitIdx = 0;
  for (let i = 0; i < words.length; i++) {
    const next = line1 ? `${line1} ${words[i]}` : words[i];
    if (visualWidth(next) <= target + 3 || i === 0) {
      line1 = next;
      splitIdx = i + 1;
    } else {
      break;
    }
  }
  const line2 = words.slice(splitIdx).join(' ').trim() || '실사용 기준 비교 분석';
  return [trimAtWordBoundary(line1, 36), trimAtWordBoundary(line2, 40)];
}

/** 좌측 콘텐츠 영역(760px)에 맞춰 폰트 크기 자동 계산 */
function calcFontSize(line, maxPx = 54, minPx = 32) {
  const w = visualWidth(line);
  if (w <= 0) return maxPx;
  const estimated = Math.floor((740 / w) * 1.7);
  return Math.max(minPx, Math.min(maxPx, estimated));
}

function renderCategoryMotif(category, accent, muted) {
  if (category === 'dev-coding') {
    return `
  <g transform="translate(868, 152)">
    <rect width="260" height="310" rx="16" fill="#0B1220" stroke="${accent}" stroke-opacity="0.38" stroke-width="1.5"/>
    <circle cx="24" cy="24" r="5" fill="#EF4444" fill-opacity="0.7"/>
    <circle cx="42" cy="24" r="5" fill="#F59E0B" fill-opacity="0.7"/>
    <circle cx="60" cy="24" r="5" fill="#10B981" fill-opacity="0.7"/>
    <line x1="0" y1="46" x2="260" y2="46" stroke="#334155" stroke-opacity="0.5"/>
    <rect x="24" y="72" width="110" height="10" rx="5" fill="${accent}" fill-opacity="0.85"/>
    <rect x="24" y="98" width="190" height="8" rx="4" fill="#475569"/>
    <rect x="24" y="120" width="160" height="8" rx="4" fill="#334155"/>
    <rect x="24" y="154" width="84" height="10" rx="5" fill="${muted}" fill-opacity="0.8"/>
    <rect x="24" y="180" width="206" height="8" rx="4" fill="#475569"/>
    <rect x="24" y="202" width="144" height="8" rx="4" fill="#334155"/>
    <rect x="24" y="242" width="212" height="42" rx="10" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-opacity="0.4"/>
    <rect x="40" y="259" width="128" height="8" rx="4" fill="${accent}"/>
  </g>`;
  }

  if (category === 'tech-gear') {
    return `
  <g transform="translate(868, 152)">
    <rect width="260" height="310" rx="16" fill="#071513" stroke="${accent}" stroke-opacity="0.38" stroke-width="1.5"/>
    <rect x="46" y="42" width="168" height="122" rx="12" fill="#0F2924" stroke="${accent}" stroke-opacity="0.6" stroke-width="1.5"/>
    <rect x="64" y="64" width="60" height="8" rx="4" fill="${accent}"/>
    <rect x="64" y="84" width="124" height="6" rx="3" fill="#64748B"/>
    <rect x="64" y="100" width="96" height="6" rx="3" fill="#475569"/>
    <rect x="64" y="124" width="132" height="18" rx="5" fill="${accent}" fill-opacity="0.2"/>
    <line x1="28" y1="202" x2="232" y2="202" stroke="${accent}" stroke-opacity="0.35"/>
    <rect x="28" y="220" width="204" height="12" rx="6" fill="#1E293B"/>
    <rect x="28" y="220" width="164" height="12" rx="6" fill="${accent}"/>
    <rect x="28" y="248" width="204" height="12" rx="6" fill="#1E293B"/>
    <rect x="28" y="248" width="122" height="12" rx="6" fill="${muted}"/>
    <rect x="28" y="276" width="204" height="12" rx="6" fill="#1E293B"/>
    <rect x="28" y="276" width="184" height="12" rx="6" fill="${accent}" fill-opacity="0.65"/>
  </g>`;
  }

  if (category === 'automation') {
    return `
  <g transform="translate(868, 152)">
    <rect width="260" height="310" rx="16" fill="#091524" stroke="${accent}" stroke-opacity="0.38" stroke-width="1.5"/>
    <rect x="40" y="36" width="180" height="50" rx="12" fill="#10253F" stroke="${accent}" stroke-opacity="0.7"/>
    <circle cx="64" cy="61" r="8" fill="${accent}"/>
    <rect x="84" y="56" width="108" height="10" rx="5" fill="#E2E8F0"/>
    <path d="M130 86V128" stroke="${accent}" stroke-width="2" stroke-dasharray="4 4"/>
    <rect x="40" y="128" width="180" height="50" rx="12" fill="#10253F" stroke="${muted}" stroke-opacity="0.7"/>
    <circle cx="64" cy="153" r="8" fill="${muted}"/>
    <rect x="84" y="148" width="92" height="10" rx="5" fill="#CBD5E1"/>
    <path d="M130 178V220" stroke="${accent}" stroke-width="2" stroke-dasharray="4 4"/>
    <rect x="40" y="220" width="180" height="54" rx="12" fill="${accent}" fill-opacity="0.16" stroke="${accent}"/>
    <circle cx="64" cy="247" r="8" fill="#34D399"/>
    <rect x="84" y="242" width="114" height="10" rx="5" fill="#FFFFFF"/>
  </g>`;
  }

  // ai-tools / default: clean benchmark bar chart motif
  return `
  <g transform="translate(868, 152)">
    <rect width="260" height="310" rx="16" fill="#0B1325" stroke="${accent}" stroke-opacity="0.38" stroke-width="1.5"/>
    <line x1="28" y1="258" x2="232" y2="258" stroke="#334155" stroke-width="1.5"/>
    <rect x="42" y="132" width="34" height="126" rx="8" fill="${accent}" fill-opacity="0.9"/>
    <rect x="92" y="82" width="34" height="176" rx="8" fill="${muted}" fill-opacity="0.9"/>
    <rect x="142" y="156" width="34" height="102" rx="8" fill="${accent}" fill-opacity="0.55"/>
    <rect x="192" y="106" width="34" height="152" rx="8" fill="#38BDF8" fill-opacity="0.8"/>
    <rect x="28" y="34" width="112" height="10" rx="5" fill="#E2E8F0" fill-opacity="0.85"/>
    <rect x="28" y="54" width="76" height="7" rx="3.5" fill="#64748B"/>
    <rect x="42" y="274" width="184" height="8" rx="4" fill="#334155"/>
  </g>`;
}

export function generateInfographicSvg({
  title,
  category = 'ai-tools',
  tags = [],
  subtitle = '공식 가격 · 실측 스펙 · 한계와 대안까지 검증',
}) {
  const themes = {
    'ai-tools': {
      label: 'AI TOOLS',
      koLabel: 'AI 툴 분석',
      bg1: '#0A101F',
      bg2: '#13203B',
      accent: '#3B82F6',
      muted: '#93C5FD',
    },
    'dev-coding': {
      label: 'DEV & LOCAL AI',
      koLabel: '개발 · 로컬 AI',
      bg1: '#0D111D',
      bg2: '#1E1B4B',
      accent: '#818CF8',
      muted: '#C7D2FE',
    },
    'tech-gear': {
      label: 'HARDWARE SPEC',
      koLabel: '하드웨어 · 스펙',
      bg1: '#081214',
      bg2: '#0B2F2A',
      accent: '#10B981',
      muted: '#6EE7B7',
    },
    automation: {
      label: 'WORKFLOW',
      koLabel: '실전 자동화',
      bg1: '#081523',
      bg2: '#16263A',
      accent: '#0EA5E9',
      muted: '#7DD3FC',
    },
    apps: {
      label: 'APP REVIEW',
      koLabel: '생산성 앱',
      bg1: '#0A1419',
      bg2: '#172554',
      accent: '#14B8A6',
      muted: '#99F6E4',
    },
  };

  const t = themes[category] || themes['ai-tools'];
  const [line1, line2] = splitHeadline(title);
  const size1 = calcFontSize(line1, 52, 32);
  const size2 = calcFontSize(line2, 44, 28);
  const cleanTags = (tags.length > 0 ? tags : ['스펙비교', '실비용', '체크리스트']).slice(0, 4);

  let chipX = 76;
  const tagChipsSvg = cleanTags
    .map((tag) => {
      const label = `#${tag}`;
      const chipW = Math.max(96, Math.round(visualWidth(label) * 11.5 + 34));
      const svg = `
  <rect x="${chipX}" y="534" width="${chipW}" height="38" rx="19" fill="#0F172A" fill-opacity="0.9" stroke="${t.accent}" stroke-opacity="0.45" stroke-width="1.2"/>
  <text x="${chipX + chipW / 2}" y="559" text-anchor="middle" fill="#E2E8F0" font-family="'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif" font-size="16" font-weight="700">${escapeXml(label)}</text>`;
      chipX += chipW + 12;
      return svg;
    })
    .join('');

  const motifSvg = renderCategoryMotif(category, t.accent, t.muted);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="675" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${t.bg1}"/>
      <stop offset="100%" stop-color="${t.bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.86" cy="0.2" r="0.52">
      <stop offset="0%" stop-color="${t.accent}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${t.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect width="1200" height="675" fill="url(#glow)"/>
  <rect x="0" y="0" width="10" height="675" fill="${t.accent}"/>
  <g stroke="#334155" stroke-opacity="0.16">
    <path d="M0 135H1200M0 270H1200M0 405H1200M0 540H1200"/>
    <path d="M240 0V675M480 0V675M720 0V675M960 0V675"/>
  </g>
  <rect x="76" y="72" width="152" height="36" rx="8" fill="${t.accent}" fill-opacity="0.18" stroke="${t.accent}" stroke-opacity="0.55"/>
  <text x="152" y="96" text-anchor="middle" fill="${t.muted}" font-family="'Pretendard', 'Malgun Gothic', sans-serif" font-size="15" font-weight="800" letter-spacing="0.8">${escapeXml(t.koLabel)}</text>
  <text x="248" y="96" fill="#64748B" font-family="'Pretendard', 'Malgun Gothic', sans-serif" font-size="14" font-weight="700" letter-spacing="1.4">${escapeXml(t.label)} · 2026</text>
  <text x="76" y="232" fill="#F8FAFC" font-family="'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif" font-size="${size1}" font-weight="900" letter-spacing="-1.2">${escapeXml(line1)}</text>
  <text x="76" y="302" fill="${t.muted}" font-family="'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif" font-size="${size2}" font-weight="800" letter-spacing="-0.8">${escapeXml(line2)}</text>
  <line x1="76" y1="354" x2="216" y2="354" stroke="${t.accent}" stroke-width="3" stroke-linecap="round"/>
  <text x="76" y="402" fill="#94A3B8" font-family="'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif" font-size="22" font-weight="500">${escapeXml(subtitle)}</text>
  ${motifSvg}
  <line x1="76" y1="498" x2="1128" y2="498" stroke="#334155" stroke-opacity="0.45"/>
  ${tagChipsSvg}
  <g transform="translate(952, 537)">
    <rect width="28" height="28" rx="7" fill="#FFFFFF" fill-opacity="0.1"/>
    <rect x="6" y="7" width="10" height="3" rx="1.5" fill="#FFFFFF"/>
    <rect x="6" y="12.5" width="16" height="3" rx="1.5" fill="${t.accent}"/>
    <rect x="6" y="18" width="12" height="3" rx="1.5" fill="${t.muted}"/>
    <text x="40" y="20" fill="#CBD5E1" font-family="'Pretendard', 'Malgun Gothic', sans-serif" font-size="17" font-weight="800" letter-spacing="1.4">SPECNOTE</text>
  </g>
</svg>
`;
}

// CLI 직접 실행 지원
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.includes('--all')) {
    const postsDir = path.resolve('src/content/posts');
    const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.mdx') || f.endsWith('.md')).sort();
    for (const file of files) {
      const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
      const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!fmMatch) continue;
      const fm = fmMatch[1];
      const getField = (k) => {
        const m = fm.match(new RegExp(`^${k}:\\s*["']?([^"'\r\n]+)["']?`, 'm'));
        return m ? m[1].trim() : '';
      };
      const cover = getField('cover');
      if (!cover || !cover.endsWith('.svg')) continue;
      const tagsMatch = fm.match(/^tags:\s*(\[.*\])/m);
      const tags = tagsMatch ? JSON.parse(tagsMatch[1]) : [];
      const svg = generateInfographicSvg({
        title: getField('title'),
        category: getField('category') || 'ai-tools',
        tags,
      });
      const out = path.resolve('public', cover.replace(/^\/+/, ''));
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, svg, 'utf8');
      console.log(`🎨 커버 재생성 완료: ${cover}`);
    }
    process.exit(0);
  }
  const get = (k) => {
    const i = args.indexOf(`--${k}`);
    return i !== -1 && args[i + 1] ? args[i + 1] : '';
  };
  const slug = get('slug');
  const title = get('title');
  if (!slug || !title) {
    console.error('사용법: node scripts/generate-cover.mjs --all 또는 --slug <slug> --title "<제목>" --category ai-tools --tags "태그1,태그2"');
    process.exit(1);
  }
  const svg = generateInfographicSvg({
    title,
    category: get('category') || 'ai-tools',
    tags: get('tags') ? get('tags').split(',').map((s) => s.trim()) : [],
    subtitle: get('subtitle') || undefined,
  });
  const out = path.resolve('public/images/covers', `${slug}.svg`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, svg, 'utf8');
  console.log(`🎨 에디토리얼 커버 생성 완료: /images/covers/${slug}.svg`);
}
