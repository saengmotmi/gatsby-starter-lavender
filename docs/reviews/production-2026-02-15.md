# Production Review (2026-02-15)

- 대상: `https://saengmotmi.netlify.app`
- 기준: `docs/ux-checklist.md`
- 실행 일시: 2026-02-15 (KST)
- 추적 이슈: `#28` (`perf: SSG UX 체크리스트 미충족 항목 트래킹`)

## 측정 근거

- Lighthouse (mobile): performance `55`, LCP `16.2s` ~ `17.9s`
- Lighthouse (desktop): performance `96`, LCP `1.0s`
- 홈 데이터: `/_root.data` = `33,853 bytes`
- 상세 데이터(41개 측정): 평균 `32,862 bytes`, p95 `70,285 bytes`, max `97,087 bytes`
- RSS: `/rss.xml` = `200` (`15,046 bytes`)
- Sitemap: `/sitemap.xml` = `404`
- 홈 초기 자원(관찰):
  - JS: `entry.client` 191KB + `chunk` 125KB
  - Font: Pretendard 3종 합계 약 `2.76MB` 요청

## 판정

| 항목 | 기준 | 결과 | 판정 |
|---|---|---|---|
| 홈 렌더 성능(모바일) | LCP < 2.5s | 16.2s ~ 17.9s | Fail |
| 홈 데이터 직렬화 | <= 50KB | 33,853 bytes | Pass |
| 상세 데이터 직렬화 | <= 150KB | max 97,087 bytes | Pass |
| RSS/sitemap/메타 | RSS+sitemap+meta 정상 | RSS 200, sitemap 404 | Partial Fail |
| 초기 폰트 전송량 | 최소화 | Pretendard 3종 2.76MB | Fail |

## 요약

현재 프로덕션은 체크리스트를 부분 충족합니다.
우선순위는 모바일 LCP 개선과 폰트 전송량 축소, sitemap 제공입니다.
