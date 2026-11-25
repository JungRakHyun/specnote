# SpecNote (스펙노트) 자동 포스팅 · 수익화 운영 매뉴얼

이 문서는 **Antigravity AI 에이전트가 자동으로 글을 작성·발행**하고, 운영자가 **애드센스·쿠팡 파트너스 수익화**를 켜는 전체 절차를 정리한 가이드입니다.

---

## 1. AI 자동 포스팅 표준 실행 절차 (에이전트용)

정기 스케줄(`/schedule`) 또는 사용자 요청으로 새 글을 발행할 때 아래 순서대로 실행합니다.

1. `content-queue.json`에서 `"status": "pending"`인 다음 주제를 선택하거나, 최신 한국 IT/AI 검색 트렌드를 웹 검색(`search_web`)으로 발굴합니다.
2. 최신 공식 가격·스펙·출시 정보를 `search_web`으로 검증합니다. (추측 금지, 기준 날짜 명시)
3. `npm run post:new -- --slug <slug> --title "<제목>" --category <카테고리> --affiliate <none|coupang|general>`로 초안과 16:9 SVG 커버를 생성합니다.
4. `src/content/posts/<slug>.mdx`를 고품질 한국어 가이드로 작성합니다:
   - `tldr` 핵심 요약 3줄 작성
   - 비교표(Markdown table), `<Callout>`, `<AdSlot position="postInArticle" format="fluid" />` 포함
   - **하드웨어(`tech-gear`) & 쿠팡 파트너스 엄격 규칙**:
     1. 해외직구(중국/일본) 전용 모델이나 단종 SKU는 추천 금지 — 반드시 **국내 정식 발매 + 쿠팡 로켓배송 재고가 풍부한 대중 모델**(삼성·LG·애플·로지텍·샌디스크 등)만 선정합니다.
     2. 쿠팡 링크는 반드시 **`affiliate-links.json`에 등록된 본인 추적 링크(`https://link.coupang.com/...`)**만 사용합니다. 임시 검색 링크(`www.coupang.com/np/search`)를 넣지 마세요.
     3. `affiliate-links.json`에 아직 링크가 없는 제품이라면 `affiliateType: "none"`(정보·스펙 비교 중심, 애드센스 트래픽 목적)으로 깔끔하게 발행하고, 운영자에게 추후 쿠팡 링크 추가가 필요한 제품명만 보고합니다.
     4. `https://link.coupang.com/...` 링크가 1개라도 포함되면 반드시 `affiliateType: "coupang"`을 설정합니다. (공정위 문구 자동 표시)
   - 기존 글 1~2개 이상 내부 링크 연결
   - `faqs` 3개 작성 (구글 `FAQPage` 리치 스니펫)
   - 한국어 조사 앞 굵게 문법 깨짐(`**...)**조사`) 방지: 괄호/따옴표로 끝나는 강조는 `<strong>...</strong>` 사용
   - `draft: false`로 변경
5. `content-queue.json`에서 해당 항목의 `"status"`를 `"published"`로 업데이트합니다.
6. `npm run publish` 실행 → `seo:audit` → `astro build` → `git commit & push` → GitHub Pages / Cloudflare Pages 자동 배포 완료!

---

## 2. 수익화 & 트래픽 세팅 체크리스트 (운영자 1회 설정)

모든 설정은 **[src/config/site.ts](src/config/site.ts)** 파일 한 곳에서 관리합니다.

### ① 무료 배포 (택 1)
- **GitHub Pages (가장 빠름):** 저장소를 GitHub에 푸시 → Settings → Pages → Source를 **GitHub Actions**로 설정하면 푸시마다 자동 배포됩니다.
- **Cloudflare Pages (커스텀 도메인 + 글로벌 CDN 최강):** Cloudflare 대시보드 → Workers & Pages → GitHub 저장소 연결 → 빌드 명령 `npm run build`, 출력 폴더 `dist`, 환경변수 `SITE_URL=https://내도메인.com`, `BASE_PATH=/` 설정.

### ② 개인 도메인 연결 (애드센스 승인 강력 추천)
- 가비아 / Cloudflare Registrar / Namecheap 등에서 `.com` 또는 `.kr` 도메인 구매 (연 약 1~2만 원)
- DNS 연결 후 `src/config/site.ts`의 `url`과 배포 환경변수 `SITE_URL` 업데이트

### ③ 검색엔진 등록 (트래픽 유입 필수)
1. **Google Search Console:** 도메인 등록 → HTML 태그 인증값을 `SITE.verification.google`에 입력 → 사이트맵 `sitemap-index.xml` 제출
2. **네이버 서치어드바이저:** 사이트 등록 → HTML 메타태그 값을 `SITE.verification.naver`에 입력 → `sitemap-index.xml`과 `rss.xml` 모두 제출

### ④ Google AdSense 수익화 켜기
- 양질의 글 **15~25편** 이상 축적 후 Google AdSense 사이트 심사 신청 (필수 페이지 `/about`, `/privacy`, `/disclaimer`, `/contact` 이미 완비됨)
- 승인 후 `src/config/site.ts`의 `adsense.clientId`(`ca-pub-...`)와 각 슬롯 ID만 입력하면 **본문 상단·중간·하단·사이드바 광고 + `/ads.txt`가 자동 활성화**됩니다.

### ⑤ 쿠팡 파트너스 즉시 수익화
- 쿠팡 파트너스 가입 후 `tech-gear` 글의 `<AffiliateCard href="..." />` 링크를 본인 추적 링크(`link.coupang.com/...`)로 교체하면 승인 대기 없이 바로 수익이 발생합니다. (공정위 문구는 `affiliateType: "coupang"`으로 자동 표시됩니다.)
