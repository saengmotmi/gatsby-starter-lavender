# ADR 0001: Runtime and Build Contract

- Status: Accepted
- Date: 2026-02-15

## Context

마이그레이션 이후 Node/Yarn 버전 표기와 실제 실행 경로가 어긋나면, 로컬에서는 되지만 CI/Netlify에서 실패할 수 있습니다. 신규 기여자도 같은 문제를 반복합니다.

## Decision

- Node 버전은 `24.x`로 고정한다. (`.nvmrc`, Netlify build env)
- Yarn 버전은 `4.12.0`으로 고정한다. (`packageManager`, vendored yarnPath)
- 설치 명령은 `yarn install --immutable`를 표준으로 삼는다.
- 품질 게이트는 `yarn verify`(typecheck + build)로 통일한다.

## Consequences

- 장점:
  - 실행 환경 차이로 인한 실패를 줄일 수 있다.
  - PR 검증 기준이 명확해진다.
  - 신규 기여자 온보딩 비용이 낮아진다.
- 비용:
  - 버전 업데이트 시 관련 파일을 함께 갱신해야 한다.
  - lockfile 변경을 엄격히 관리해야 한다.
