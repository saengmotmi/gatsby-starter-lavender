---
title: 2023-05-19 개발... 아주 조금 늘었을까...?
date: 2023-05-19
description: 미생물을 벗어나려 몸부림치던 날들이 있었다
tags: [Article]
thumbnail: /thumbnails/hello-world.jpg
---

얼마 전 부터 내가 운영하기 시작한 FE 전용 디스코드 서버에 질문이 하나 올라왔다.

> vite 쓰면서 performance is not defined 에러 겪어보신분 계신가요?? codebuild상에서 저 에러가 나는데 찾아봐도 나오질 않네요

순간적으로 CI/CD 환경에서 Node.js 버전이 개발 환경보다 낮아서 생기는 문제 아닐까 싶어 ChatGPT에 질문을 넣었고, 아래와 같이 답변을 받았다.

> Q: nodejs에서 performance api가 not defined라는 에러가 뜨고 있어. nodejs에서 performance 객체가 전역 객체에 몇 버전에서 추가되었는지 알려줘.
>
> A: Node.js에서 performance 객체가 전역 객체에 추가된 버전은 v16.0.0입니다​ [1​]. (https://nodejs.dev/en/api/v18/globals/#performance)

확인 차 StackOverflow에서도 검색해보니 내가 생각한 이유가 맞았다. `performance.now()` 같은 형태로 많이 사용하는 Performance API는 Node.js 8버전 대 부터 지원하기 시작했다.

다만 전역 객체에 들어간 건 16 버전부터 라서 Vite로 빌드할 시점의 Node.js 버전이 낮으면 전역 객체에서 `performance`를 찾지 못해 위와 같은 에러가 발생할 수 있다. 따라서 그 이하 버전의 Node 환경에서는 아래와 같이 `require`로 해당 함수를 불러와 쓰거나, 빌드 타임에 alias 등을 사용하여 Polyfill을 넣어주면 된다. 아니면 Node 버전을 16으로 올리거나.

```ts
// 예시 코드
const { performance } = require("perf_hooks");
```

```ts
// vite.config.ts - 예시 코드
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      performance: resolve(__dirname, "src/performance.ts"),
    },
  },
});
```

사실 이 정도 디버깅은 좀만 찾아보면 그렇게까지 어렵지 않게 해결할 수도 있는데, 이런 질문을 받고 나서 내가 개발자로서 얼마나 성장했는지에 대해 생각해보게 되었다.

이 과정 속에서 내가 알고 있었어야 하는 지식들을 목록화 해보자면 대략 아래와 같이 정리할 수 있을 것이다.

- `Performance API`가 window나 global 객체에 추가되어 쓰일 수 있다는 사실

- Node 환경에서 `Performance API`가 `perf_hooks` 패키지의 함수로 구현되어 있다는 사실 (Vite 내부 코드를 뜯어보다 발견했었다)

- Node 버전 별로 API가 제공되는 인터페이스가 다를 수 있다는 사실

- CI/CD 환경이 어떻게 구성되고 `AWS CodeBuild`가 배포 파이프라인 상에서 무슨 역할을 하는지 (실무를 하면서 조금 만져봤다)

- 프론트엔드 개발에서 빌드라는 과정이 무슨 역할을 하는지

- Vite가 빌드 타임에 어떤 방식으로 코드를 번들링하고, 개발자가 어떤 방식으로 빌드 타임에 개입할 수 있는지 (실무에서 라이브러리 만들면서 플러그인들을 좀 찾아봤다)

내가 가장 기쁜 점은 이 목록 모두가 특정 SPA 프레임워크의 키워드에 속해있지 않았고, 머릿 속에서 직관적으로 이 지식들을 조합해 해결책을 냈다는 점이다. 단순히 코드만 받아 치는 레벨은 벗어난 것이 아닐까?

작은 성취 속에서도 성장을 발견해낼 수 있는 사람이 되고 싶어 이렇게 글을 써본다. 앞으로도 문득 성장한 나에 대한 에피소드들로 글을 종종 남길 수 있으면 좋겠다. 그렇게 나 아닌 다른 사람들의 성장 또한 알아볼 수 있는 눈이 생기기를.
