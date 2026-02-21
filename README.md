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
yarn new:post   # 새 글 스캐폴딩
yarn dev        # 콘텐츠 생성 + 개발 서버
yarn build      # 콘텐츠 생성 + 정적 빌드
yarn typecheck  # route typegen + tsc
yarn verify     # typecheck + build
```

## New Post CLI

새 글 템플릿을 자동으로 생성합니다.

```bash
yarn new:post
```

옵션 기반으로 바로 생성할 수도 있습니다.

```bash
yarn new:post -- \
  --category article \
  --slug my-first-post \
  --title "2026-02-21 새 글 제목" \
  --description "한 줄 요약" \
  --tags "Article,React"
```

## Build/Data Flow

- Content source: `content/blog/**/*.md`
- Static assets: `static/`
- Build data generator: `scripts/generate-content.mjs`
- Generated artifacts:
  - `app/generated/posts.json`
  - `public/content/blog/**/*`
  - `public/rss.xml`

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
