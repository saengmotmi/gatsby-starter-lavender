# Architecture

## 목적

이 프로젝트는 Markdown 기반 정적 블로그를 React Router v7 Framework Mode + Vite SSG로 빌드합니다.

## 레이어

1. Content layer
- 소스: `content/blog/**/*.md`
- 메타데이터/본문 파싱: `scripts/generate-content.mjs`

2. Build-data layer
- 생성물: `app/generated/posts.json`
- 상세 페이지는 slug 단위로 필요한 데이터만 로드하도록 분리

3. UI layer
- 홈: 목록/검색/태그
- 상세: 본문/TOC/댓글/해시 이동

4. Delivery layer
- 정적 산출물: `build/client`
- RSS: `build/client/rss.xml`
- OG 이미지: `build/client/og/**/*` (빌드 시 생성)
- 배포: Netlify

## 렌더링 흐름

1. 빌드 시 Markdown 파싱 및 산출물 생성
2. React Router prerender로 정적 HTML 생성
3. 클라이언트 hydration
4. 라우팅 후 필요한 페이지 데이터만 로드

## 성능 원칙

- 홈에서 상세 본문 HTML 전체를 직렬화하지 않음
- 라우트 단위 데이터 로딩 유지
- 빌드 산출물 크기와 개별 요청 크기를 함께 점검

## 운영 원칙

- Node/Yarn 버전은 단일 계약으로 유지
- 로컬/CI/Netlify 명령을 동일하게 유지
- 회귀 방지는 CI(`yarn verify`)로 강제
