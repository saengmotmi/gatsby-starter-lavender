# Lavender Blog

Gatsby 기반 스타터를 React Router v7 Framework Mode + Vite SSG로 마이그레이션한 정적 블로그입니다.

## Runtime Contract

- Node: `24.x` (`.nvmrc`)
- Yarn: `4.12.0` (`packageManager`, `.yarn/releases/yarn-4.12.0.cjs`)
- Install policy: `yarn install --immutable`

로컬, CI, Netlify 모두 같은 계약을 따릅니다. 버전 정보는 반드시 위 3개 파일 기준으로 함께 수정합니다.

## Quick Start

```bash
corepack yarn install --immutable
corepack yarn dev
```

## Commands

```bash
yarn dev        # 콘텐츠 생성 + 개발 서버
yarn build      # 콘텐츠 생성 + 정적 빌드
yarn typecheck  # route typegen + tsc
yarn verify     # typecheck + build
```

## Analytics (GTM)

Google Tag Manager를 `<head>` script + `<body>` noscript iframe 방식으로 적용합니다.

- 컨테이너 ID: `GTM-NGXTQ8ZS`
- 적용 위치: `app/root.tsx`
- 프로덕션 빌드에서만 GTM 스니펫이 삽입됩니다.

GTM 태그/트리거/변수 설정은 Google Tag Manager 콘솔에서 관리합니다.

## Build/Data Flow

- Content source: `content/blog/**/*.md`
- Static assets: `static/`
- Build data generator: `scripts/generate-content.mjs`
- Generated artifacts:
  - `app/generated/posts.json`
  - `public/content/blog/**/*`
  - `public/og/**/*` (OG 이미지)
  - `public/rss.xml`
  - `public/sitemap.xml`
  - `public/robots.txt`

## Blog Essentials

기술 블로그 운영을 위한 기본 SEO/배포 산출물을 빌드 시 자동 생성합니다.

- RSS: `rss.xml`
- Sitemap: `sitemap.xml` (홈 + 공개 포스트)
- Robots: `robots.txt` (Sitemap 경로 포함)
- Structured data:
  - 홈: `WebSite`, `Blog`
  - 포스트: `BlogPosting`

## Routes

- `/`: 포스트 목록 + 검색/태그 필터
- `/:category/:slug`: 포스트 상세

## Maintenance Docs

- 기여 가이드: `CONTRIBUTING.md`
- 아키텍처: `docs/architecture.md`
- 결정 기록(ADR): `docs/adr/0001-runtime-and-build-contract.md`
- UX 체크리스트: `docs/ux-checklist.md`
- 프로덕션 점검 리포트: `docs/reviews/production-2026-02-15.md`

## Testbed Policy

이 저장소는 프로덕션 블로그의 SSG 사용성/성능 기준을 검증하고 학습하기 위한 테스트베드입니다.
신규 변경은 `docs/ux-checklist.md` 기준으로 검토하고, 미충족 항목은 이슈로 추적합니다.
