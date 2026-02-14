# Contributing Guide

## 목표

- 로컬, CI, 배포 환경의 동작 차이를 줄입니다.
- 변경 이유와 검증 근거를 PR에서 바로 확인할 수 있게 만듭니다.

## 개발 환경

```bash
corepack yarn install --immutable
```

- Node는 `.nvmrc`를 따릅니다.
- Yarn은 `package.json`의 `packageManager`와 `.yarn/releases`를 따릅니다.

## 작업 절차

1. 브랜치를 생성합니다. (`codex/*`, `feature/*`, `fix/*` 등)
2. 기능/수정 반영 후 아래를 실행합니다.

```bash
yarn verify
```

3. PR 템플릿의 배경/원인/검증 항목을 채웁니다.

## PR 기준

- 목적과 기술적 배경이 분명해야 합니다.
- 회귀 가능 경로(홈, 포스트 상세, RSS, 배포 설정)를 확인해야 합니다.
- 설정 파일을 건드렸다면 이유와 영향 범위를 적어야 합니다.

## 커밋/훅

- pre-commit에서 `lint-staged`가 실행됩니다.
- CI가 최종 품질 게이트입니다. 로컬 훅 통과만으로 merge 기준을 만족하지 않습니다.
