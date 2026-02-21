# Debugging Mental Model

목표는 "감"이 아니라, 재현/측정/반증으로 빠르게 수렴하는 것입니다.

## 핵심 공식

`Output = f(Input, State, Environment, Time)`

- Input: 사용자 액션, URL, 디바이스, 네트워크 조건
- State: 메모리/라우터 상태, history state, local/session storage, (있다면) Service Worker cache
- Environment: CDN/캐시 헤더, 브라우저/OS, 빌드 설정, 배포 상태
- Time: 배포 직후/캐시 cold-warm, first load vs repeat, 뒤로/앞으로가기 같은 히스토리 복원 타이밍

한 문장으로: "SSG인데 느림/FOUC"도 보통 서버가 아니라 `State/Environment/Time` 문제일 확률이 높습니다.

## 디버깅 루프(순서 고정)

1. 정상동작/현재동작을 1문장씩 확정한다. (합의 없으면 중단)
2. 최소 재현 절차를 확정한다. (환경/디바이스/네트워크 포함)
3. 관측한다. (워터폴, 캐시 헤더, trace, 로그, perf marks)
4. 가설을 3개 이하로 제한한다.
5. 가장 싼 실험(1분짜리 반증)부터 돌려 가설을 죽인다. (한 번에 변수 1개)
6. 첫 분기점(first divergence)을 타임라인에서 찾고, 거기부터 거슬러 올라간다.
7. 수정한다. (원인에만 대응, 주변부 리팩터링 금지)
8. 검증/가드레일을 남긴다. (테스트/스크립트/전후 수치)

## 웹/SSG에서 자주 생기는 착각

### 1) 캐시는 레이어가 여러 겹이다

- Router/메모리(라우터 상태)
- 브라우저 HTTP cache
- CDN cache
- Service Worker cache(있다면)

따라서 "느림"과 "갱신 안 됨"은 어느 레이어에서 발생했는지부터 분리해야 합니다.

### 2) SSG여도 내부 전환이 SPA면 클릭 이후 워터폴이 생긴다

- 라우트 전환 시점에 `route.js/route.css/*.data`가 로드되면, 느린 네트워크에서 워터폴이 생깁니다.
- CSS 적용이 렌더보다 늦으면 FOUC가 발생합니다.

해결 축은 대체로 아래 3가지로 정리됩니다.

- prefetch로 click 이전에 리소스를 당기기
- HTTP 캐시 헤더로 재검증 비용 제거하기
- CSS chunk 전략(라우트별 분리 vs 단일 번들) 재검토하기

### 3) 스크롤 복원은 scrollY만의 문제가 아니다

`ScrollRestoration`이 저장된 `scrollY`로 이동하려면, 그 `scrollY`가 가능할 만큼의 DOM 높이(=UI 상태)가 먼저 복원되어야 합니다.

예: 홈 목록이 infinite scroll로 "몇 개까지 렌더됐는지"가 복원되지 않으면, 깊은 scrollY는 DOM 높이 부족으로 clamp되어 "복구가 안 됨"처럼 보일 수 있습니다.

## 30분 트리아지 템플릿

- 정상동작:
- 현재동작:
- 재현 절차:
- 범위(어디까지 영향?):
- 증거:
  - 헤더(`curl -I`):
  - 워터폴/trace:
  - 빌드 산출물 확인(HTML/CSS/JS/data):
- 가설(<= 3):
- 실험(가설별 1분짜리 반증 실험):
- 결론(원인):
- 수정(최소 변경):
- 재발 방지(테스트/스크립트/수치):

## PR 원칙

- 1 PR = 1 해결책 (섞지 말 것)
- "의도대로 동작함"을 증명하는 증거 포함 (테스트/스크립트/전후 수치)
- UX/스펙 변경(기능 제거/동작 변경)은 버그fix PR과 분리하고 먼저 확인받기

