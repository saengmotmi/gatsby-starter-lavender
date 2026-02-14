# Lavender Blog (React Router v7)

Gatsby 기반 스타터를 **React Router v7 Framework Mode + Vite SSG**로 마이그레이션한 정적 블로그입니다.

## Stack

- React Router Framework Mode (`react-router` + `@react-router/dev`)
- Vite
- Markdown pipeline (`gray-matter`, `remark`, `rehype`)
- Build-time pre-render (`react-router.config.ts`)

## Requirements

- Node `24.x` (LTS)
- Yarn `4.x` (`.yarn/releases/yarn-4.12.0.cjs` vendoring)

## Scripts

```bash
yarn dev          # 콘텐츠 생성 + 개발 서버
yarn build        # 콘텐츠 생성 + 정적 빌드
yarn typecheck    # route typegen + tsc
```

## Content Source

- Markdown: `content/blog/**/*.md`
- 정적 에셋: `static/`

빌드 전에 `scripts/generate-content.mjs`가 실행되어 다음을 생성합니다.

- `app/generated/posts.json`
- `public/content/blog/**/*` (이미지 등)
- `public/rss.xml`

## Routes

- `/` : 포스트 목록 + 검색/태그 필터
- `/:category/:slug` : 포스트 상세
