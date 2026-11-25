#!/usr/bin/env node
/**
 * SpecNote — SEO · 애드센스 · 탈(脫)AI 에디토리얼 품질 자동 검수 스크립트
 * 발행 전 저품질·누락·AI 상투어 항목을 자동으로 검출합니다.
 */
import fs from 'node:fs';
import path from 'node:path';

const POSTS_DIR = path.resolve('src/content/posts');
const PUBLIC_DIR = path.resolve('public');

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { fm: '', body: raw };
  return { fm: match[1], body: match[2] };
}

function getField(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*["']?([^"'\r\n]+)["']?`, 'm'));
  return m ? m[1].trim() : '';
}

const AI_CLICHE_PATTERNS = [
  { regex: /단순한\s+[^.\n]{2,35}을\s*넘어/, label: '"단순한 ~을 넘어" 도입 상투어' },
  { regex: /단순히\s+[“"'`][^.\n]{2,35}[”"'`]\s*단계를/, label: '"단순히 ~단계를" 도입 상투어' },
  { regex: /고민하는\s*분들이\s*많습니다/, label: '"고민하는 분들이 많습니다" 상투어' },
  { regex: /막막해지기\s*쉽습니다|막막한\s*경우가\s*많습니다/, label: '"막막한 경우가 많습니다" 상투어' },
  { regex: /압도적인|끝판왕|완벽하게\s*보완|가성비\s*최강/, label: '과장형 AI 상투어(압도적인/끝판왕/최강)' },
  { regex: /실시간\s*특가/, label: '모호한 가격 표기("실시간 특가" 대신 구체 가격대 기재)' },
];

const files = fs
  .readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
  .sort();

let errorCount = 0;
let warnCount = 0;

console.log(`\n🔍 SpecNote SEO & Editorial Audit — 총 ${files.length}개 포스트 검사 중...\n`);

for (const file of files) {
  const fullPath = path.join(POSTS_DIR, file);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const { fm, body } = parseFrontmatter(raw);

  const issues = [];
  const warnings = [];

  const title = getField(fm, 'title');
  const description = getField(fm, 'description');
  const cover = getField(fm, 'cover');
  const affiliateType = getField(fm, 'affiliateType') || 'none';
  const isDraft = getField(fm, 'draft') === 'true';

  if (isDraft) {
    console.log(`⏭️  ${file} (draft — 건너뜀)`);
    continue;
  }

  // 1. 제목 길이
  if (!title || title.length < 15) {
    issues.push(`제목이 너무 짧습니다 (${title.length}자, 최소 15자 권장)`);
  } else if (title.length > 72) {
    warnings.push(`제목이 검색 결과에서 잘릴 수 있습니다 (${title.length}자, 65자 이하 권장)`);
  }

  // 2. 메타 설명
  if (!description || description.length < 55) {
    issues.push(`meta description이 너무 짧습니다 (${description.length}자, 60~155자 권장)`);
  } else if (description.length > 165) {
    warnings.push(`meta description이 165자를 초과합니다 (${description.length}자)`);
  }

  // 3. 커버 이미지 파일 존재 여부
  if (!cover) {
    issues.push('cover 이미지 경로가 비어 있습니다.');
  } else {
    const imgPath = path.join(PUBLIC_DIR, cover.replace(/^\/+/, ''));
    if (!fs.existsSync(imgPath)) {
      issues.push(`cover 이미지 파일이 존재하지 않습니다: public/${cover.replace(/^\/+/, '')}`);
    }
  }

  // 4. 본문 분량 (Thin Content 방지)
  const plainBody = body
    .replace(/^import\s+.*$/gm, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\s+/g, '');
  if (plainBody.length < 1100) {
    issues.push(`본문 분량이 부족합니다 (공백 제외 ${plainBody.length}자, 애드센스 권장 1,200자 이상)`);
  }

  // 5. H2 소제목 구조
  const h2Matches = body.match(/^##\s+.+$/gm) || [];
  if (h2Matches.length < 2) {
    issues.push(`H2(##) 소제목이 2개 미만입니다 (${h2Matches.length}개)`);
  }

  // 6. FAQ 리치 스니펫 체크
  if (!/^faqs:/m.test(fm)) {
    warnings.push('faqs 항목이 없습니다 (구글 FAQPage 리치 스니펫 권장)');
  }

  // 7. 쿠팡 링크 포함 시 공정위 고지 필수 검증 + 미추적 일반 검색 링크 경고
  const hasCoupang = /coupang\.com|provider="coupang"/i.test(body);
  if (hasCoupang && affiliateType !== 'coupang') {
    issues.push('본문에 쿠팡 링크가 있으나 frontmatter에 affiliateType: "coupang"이 설정되지 않았습니다 (공정위 문구 필수)');
  }
  if (/www\.coupang\.com\/np\/search/i.test(body)) {
    issues.push('일반 쿠팡 검색 링크가 포함되어 있습니다. affiliate-links.json의 본인 추적 링크(link.coupang.com)로 교체하세요.');
  }

  // 8. 한국어 CommonMark 굵게(**...**) 깨짐 패턴 감지
  const brokenBold = body.match(/\*\*[^*\r\n]+[)\]}"'’”]\*\*[가-힣]/g);
  if (brokenBold) {
    issues.push(`한국어 조사 앞 굵게(**...**) 문법 깨짐 감지: ${brokenBold.join(', ')} → <strong> 태그를 사용하세요.`);
  }

  // 9. 탈(脫)AI 에디토리얼 품질 검사 (상투어·과장어)
  for (const { regex, label } of AI_CLICHE_PATTERNS) {
    if (regex.test(body) || regex.test(fm)) {
      warnings.push(`AI 상투어/모호한 표현 감지 (${label}) — 구체적인 사실·수치로 다듬으세요.`);
    }
  }

  // 10. 외부 공식 출처 링크 확인 (쿠팡 제휴 링크 제외)
  const externalUrls = (body.match(/https?:\/\/[^\s)"'>]+/g) || []).filter(
    (u) => !/coupang\.com/i.test(u)
  );
  if (externalUrls.length === 0) {
    warnings.push('공식 출처/참고 외부 링크가 없습니다 (공식 가격표·문서·스펙 링크 최소 1~2개 권장)');
  }

  if (issues.length === 0 && warnings.length === 0) {
    console.log(`✅ ${file} — 통과 (${plainBody.length}자, H2 ${h2Matches.length}개, 출처 ${externalUrls.length}건)`);
  } else {
    const icon = issues.length > 0 ? '❌' : '⚠️';
    console.log(`${icon} ${file} (${plainBody.length}자, H2 ${h2Matches.length}개, 출처 ${externalUrls.length}건)`);
    for (const msg of issues) {
      console.log(`   [ERROR] ${msg}`);
      errorCount++;
    }
    for (const msg of warnings) {
      console.log(`   [WARN]  ${msg}`);
      warnCount++;
    }
  }
}

console.log(`\n📊 검수 결과: 오류 ${errorCount}건, 경고 ${warnCount}건\n`);

if (errorCount > 0) {
  process.exit(1);
}
