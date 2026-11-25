/**
 * SpecNote (스펙노트) — 사이트 통합 설정 파일
 * 도메인 연결, 구글 애드센스, 쿠팡 파트너스, 검색엔진(구글/네이버) 인증을
 * 이 파일 한 곳에서 간편하게 관리합니다.
 */

export interface CategoryMeta {
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  accent: string;
}

export const SITE = {
  // 1. 브랜드 & 기본 SEO 정보
  name: 'SpecNote',
  koName: '스펙노트',
  tagline: '숫자와 스펙으로 끝내는 AI · IT 비교 매거진',
  description:
    '최신 AI 요금제, 코딩 도구, 노트북·IT 기기 스펙을 공식 데이터와 실사용 기준으로 비교 정리하는 테크 리뷰 매거진 스펙노트입니다.',
  locale: 'ko_KR',
  lang: 'ko',
  author: {
    name: '스펙노트 편집부',
    bio: 'AI 서비스 요금제, 개발 생산성 툴, IT 하드웨어 스펙을 1차 공식 자료와 실사용 시나리오로 교차 검증해 정리합니다.',
    email: 'jlakh@naver.com',
  },

  // 2. 도메인 & 기본 OG 이미지 (추후 개인 도메인 연결 시 url과 배포 환경변수 SITE_URL만 변경)
  url: 'https://jungrakhyun.github.io',
  ogDefaultImage: '/images/covers/ai-subscription-2026.svg',

  // 3. 검색엔진 소유권 인증 메타태그 (구글 서치콘솔 / 네이버 서치어드바이저 인증 content 값)
  verification: {
    google: '1r9axE2uczIThCoMnFY-eTh9NsP47UbpI9I2zwNq1SE',
    naver: '',
    bing: '',
  },

  // 4. IndexNow (네이버/빙 빠른 자동 색인용 키)
  indexNowKey: '',

  // 5. 구글 애드센스 수익화 설정
  // 승인 후 'ca-pub-0000000000000000' 입력 시 광고 슬롯과 /ads.txt 자동 활성화
  adsense: {
    clientId: '',
    slots: {
      postTop: '',
      postInArticle: '',
      postBottom: '',
      sidebar: '',
    },
    showDevPlaceholder: false,
  },

  // 6. 제휴 마케팅 (쿠팡 파트너스 / SaaS 제휴) 공정위 고지 문구
  affiliate: {
    coupangNotice:
      '이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.',
    generalNotice:
      '이 글에는 제휴 링크가 포함되어 있으며, 링크를 통해 가입·구매 시 추가 비용 없이 스펙노트 운영에 소정의 수수료가 지급될 수 있습니다. 모든 비교와 평가는 공식 스펙과 객관적 기준을 바탕으로 작성됩니다.',
  },

  // 7. Google Analytics 4 (선택)
  ga4MeasurementId: '',
} as const;

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: 'ai-tools',
    label: 'AI 툴 비교',
    shortLabel: 'AI 비교',
    description: 'ChatGPT, Claude, Gemini, Perplexity 등 최신 AI 서비스 요금제·성능 실전 비교',
    accent: 'blue',
  },
  {
    slug: 'dev-coding',
    label: 'AI 코딩·개발',
    shortLabel: 'AI 코딩',
    description: 'Cursor, Windsurf, Claude Code, Copilot 등 개발 생산성 도구 심층 가이드',
    accent: 'indigo',
  },
  {
    slug: 'tech-gear',
    label: 'IT 기기·스펙',
    shortLabel: 'IT 기기',
    description: '맥북, AI 노트북, 모니터, 주변기기 스펙·가성비 비교 및 구매 가이드',
    accent: 'emerald',
  },
  {
    slug: 'automation',
    label: '업무 자동화',
    shortLabel: '업무 자동화',
    description: '노션, 구글 워크스페이스, AI 에이전트로 반복 업무를 줄이는 실전 워크플로',
    accent: 'sky',
  },
];

export function getCategoryMeta(slug: string): CategoryMeta {
  return (
    CATEGORIES.find((c) => c.slug === slug) ?? {
      slug,
      label: slug,
      shortLabel: slug,
      description: `${slug} 관련 최신 비교 리포트`,
      accent: 'blue',
    }
  );
}
