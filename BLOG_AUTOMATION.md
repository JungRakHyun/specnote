# SpecNote (스펙노트) 자동 포스팅 · 수익화 운영 매뉴얼

이 문서는 **Antigravity AI 에이전트가 실전 정보 밀도가 높은 기술·스펙 가이드를 자동으로 작성·발행**하고, 운영자가 **애드센스·쿠팡 파트너스 수익화**를 관리하는 전체 기준입니다.

---

## 1. 탈(脫)AI 에디토리얼 작성 원칙 (필수 준수)

검색 유입과 애드센스 승인, 독자 재방문을 위해 **전형적인 AI 요약체("AI티")를 철저히 배제**하고, 실제 구매·도입 직전의 독자가 북마크할 만한 구체적인 정보만 씁니다.

### ① 금지 패턴 (사용 금지)
- **천편일률적 도입부 금지:** `"단순한 ~을 넘어 ~단계로"`, `"~고민하는 분들이 많습니다"`, `"막막해지기 쉽습니다"`, `"이 글에서는 ~를 한눈에 정리해 드립니다"` 같은 서론 금지. **첫 2문장 안에 핵심 결론, 구체적 숫자, 또는 독자가 자주 겪는 함정**을 바로 꺼내세요.
- **과장·홍보 상투어 금지:** `압도적인`, `끝판왕`, `최강`, `완벽하게`, `혁신적인`, `필수템`, `실시간 특가` 사용 금지.
- **형식 복붙 금지:** 모든 글을 `①②③④ 장점/추천대상` + `3초 최종 요약`으로 찍어내지 마세요. 소제목에 `—`(긴 대시)를 남발하지 말고, `tldr`·비교표·본문·결론에서 **같은 문장을 반복하지 마세요**.
- **모호한 제품명·가격 금지:** `"~계열"`, `"~시리즈"`, `"실시간 특가"`처럼 뭉뚱그리지 말고 **정확한 단일 모델명(예: `27UP850K`, `32UP830K`)과 확인된 시장 가격대(예: `약 40만 원대 중후반`)**를 명시하세요.

### ② 필수 심층 아티클 4단 구조 (겉핥기 요약 금지 — 정보 밀도 기준)
`apps` 카테고리를 제외한 모든 테크·AI·하드웨어 가이드는 **공백 제외 3,000자 이상(권장 3,500~5,000자)** 분량으로 아래 4가지 요소를 **모두** 갖춰야 합니다:
1. **개념과 동작 원리("애초에 이게 무엇이고 왜 이 스펙이 중요한가"):** 처음 읽는 독자도 인과관계를 이해하도록 배경 원리부터 짚습니다. (예: 로컬 LLM과 양자화 원리, 맥북 통합 메모리 vs NVIDIA VRAM 차이, macOS HiDPI 스케일링, AI 코딩 FIM vs RAG vs 자율 루프 등)
2. **세부 모델·단일 제품 성능 정밀 비교:** 브랜드 이름만 나열하지 말고 내부 세부 모델(예: Claude Opus/Sonnet/Haiku, GPT-6 추론, EXAONE 3.5/Qwen3/Gemma 3, LG 27UP850K/32UP830K 등)의 아키텍처·성능·가격·사용량 한도를 구체적으로 비교합니다.
3. **사용자 유형(직군·상황) 4~6가지별 맞춤 추천 + 비추천("이럴 땐 사지 마세요"):** "어떤 사용자에게는 무엇이 맞고, 어떤 경우에는 왜 다른 선택지나 무료/대안이 나은지" 명확하게 갈라줍니다.
4. **실전 계산·세팅·트러블슈팅 + 공식 출처 2개 이상:** 실비용·속도 계산 공식, 복붙 가능한 설정 코드/명령어, Before/After 예시를 넣고 본문 하단에 공식 문서·요금표·제조사 스펙 링크를 2개 이상 기재하며 확인 기준 날짜(예: `2026년 11월 기준`)를 명시합니다.

---

## 2. AI 자동 포스팅 표준 실행 절차 (에이전트용)

정기 스케줄 또는 사용자 요청으로 새 글을 발행할 때 아래 순서대로 실행합니다.

1. `git pull --rebase origin main`으로 원격 최신 변경사항(`BLOG_AUTOMATION.md`, `content-queue.json`, `affiliate-links.json`)을 동기화합니다.
2. `content-queue.json`에서 `"status": "pending"`인 다음 주제를 선택하거나, 대기열이 비었다면 최신 한국 IT/AI 검색 트렌드를 `search_web`으로 발굴합니다.
3. 최신 공식 가격·단일 모델 스펙·사용량 제한·출시 정보를 `search_web`으로 검증합니다. (추측 금지, 확인 기준 날짜 및 공식 출처 링크 명시)
4. `npm run post:new`로 대기열 다음 항목의 초안과 16:9 SVG 커버를 생성합니다. (신규 발굴 주제는 `-- --slug <slug> --title "<제목>" --category <카테고리> --affiliate <none|coupang|general> --tags "<태그1,태그2>"` 전달)
5. `src/content/posts/<slug>.mdx`를 위 **탈(脫)AI 에디토리얼 작성 원칙**에 따라 작성합니다:
   - `tldr` 핵심 요약 3줄 (본문과 문장 복붙 금지, 수치·결론 위주)
   - 비교표(Markdown table), `<Callout>`, `<AdSlot position="postInArticle" format="fluid" />` 포함
   - **하드웨어(`tech-gear`) & 쿠팡 파트너스 엄격 규칙**:
     1. 해외직구(중국/일본) 전용 모델이나 단종 SKU는 추천 금지 — 반드시 **국내 정식 발매 + 쿠팡 로켓배송 재고가 풍부한 대중 모델**(삼성·LG·애플·로지텍·샌디스크 등)만 선정합니다.
     2. 쿠팡 링크는 반드시 **`affiliate-links.json`에 등록된 본인 추적 링크(`https://link.coupang.com/...`)**만 사용합니다. 임시 검색 링크(`www.coupang.com/np/search`)를 넣지 마세요.
     3. `affiliate-links.json`에 아직 링크가 없는 제품이라면 `affiliateType: "none"`(정보·스펙 비교 중심, 애드센스 트래픽 목적)으로 깔끔하게 발행하고, 운영자에게 추후 쿠팡 링크 추가가 필요한 제품명만 보고합니다.
     4. `https://link.coupang.com/...` 링크가 1개라도 포함되면 반드시 `affiliateType: "coupang"`을 설정합니다. (공정위 문구 자동 표시)
     5. 글 흐름과 무관한 억지 제휴 카드는 넣지 마세요.
   - 기존 글 1~2개 이상 자연스러운 내부 링크 연결
   - `faqs` 3개 작성 (본문에 이미 나온 뻔한 질문이 아니라, 독자가 결제·설치 직전에 실제로 헷갈리는 질문 위주)
   - 한국어 조사 앞 굵게 문법 깨짐(`**...)**조사`) 방지: 괄호/따옴표로 끝나는 강조는 `<strong>...</strong>` 사용
   - `draft: false`로 변경
6. `content-queue.json`에서 해당 항목의 `"status"`를 `"published"`로 업데이트합니다.
7. `npm run publish` 실행 → `seo:audit` (오류 0건, 경고 0건 확인) → `astro build` → `git commit & push` → GitHub Pages / Cloudflare Pages 자동 배포 완료!

---

## 3. 수익화 & 트래픽 세팅 체크리스트 (운영자 1회 설정)

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
- 쿠팡 파트너스 가입 후 `affiliate-links.json`에 본인 추적 링크(`link.coupang.com/...`)를 등록하면 이후 자동 포스팅에서 자동으로 활용됩니다. (공정위 문구는 `affiliateType: "coupang"`으로 자동 표시됩니다.)
