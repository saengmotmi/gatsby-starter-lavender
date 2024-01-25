---
title: 2024-01-26 use()에 대한 매우 짧은 단상
date: 2024-01-26
description: 단상이란 짧은 생각을 의미합니다
tags: [React, React Canary, React Experimental, use hook]
thumbnail: /thumbnails/hello-world.jpg
---

## Suspense를 트리거 하는 방법

Suspense는 흔히 로딩 스피너를 띄우는 용도로 많이 알려져 있다. 반은 맞고 반은 틀리다고 생각한다. 물론 그런 용례가 있기는 하지만 그게 전부는 아니다. Promise를 로딩 스피너를 표현하는 데 사용할 수 있지만 그 본질적인 의미는 '비동기 상황을 값으로 다루는 것'에 있다. Suspense는 컴포넌트의 비동기 상황을 React에서 일급으로 지원하는 것이 핵심이며, 비동기 렌더링에 대한 구간별 경계를 긋기 위한 기능이라고도 소개할 수 있겠다.

Streaming SSR(React Fizz)을 생각해보자. 서버 측에서 로딩 중인 데이터를 모두 기다리지 않고 일부 데이터만 먼저 응답하도록 한다. 어디부터 어디까지를 기다릴 것인가? 당연하게도 Suspense가 그 경계가 되어준다. 자세한 건 RSC의 [스트리밍에 대해 다루는 글](https://oj8mm.notion.site/Static-SSR-vs-Streaming-SSR-a41c2aa07ac44cc28250c7b6d611e582)을 참고하자.

이야기가 좀 샜는데, 마치 이러한 오해들 처럼 Suspense를 트리거 하는 방법은 React Query나 SWR 같은 fetcher 라이브러리의 `suspense: true` 옵션 같은 걸로만 트리거 가능하다고 생각하는 사람들이 적지 않다.

앞에서 언급한 라이브러리를 포함하여 현재 React에서 Suspense를 트리거 하는 공식적인 방법은 `use()` hook을 사용하는 것이다. 현재 Canary 버전에서 사용 가능하며 [공식 문서](https://react.dev/reference/react/use)에도 등록이 되어 있긴 하다. RFC는 [이쪽](https://github.com/reactjs/rfcs/pull/229)이고, 실제 구현은 [이쪽](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberHooks.js#L1094-L1112)이다.

아래는 [jotai](https://github.com/pmndrs/jotai/blob/main/src/react/useAtomValue.ts#L13-L42)에서 훑어온 코드이다. 딱히 jotai인 이유는 없다.

```ts
const use =
  ReactExports.use ||
  (<T>(
    promise: PromiseLike<T> & {
      status?: "pending" | "fulfilled" | "rejected";
      value?: T;
      reason?: unknown;
    }
  ): T => {
    if (promise.status === "pending") {
      throw promise;
    } else if (promise.status === "fulfilled") {
      return promise.value as T;
    } else if (promise.status === "rejected") {
      throw promise.reason;
    } else {
      promise.status = "pending";
      promise.then(
        (v) => {
          promise.status = "fulfilled";
          promise.value = v;
        },
        (e) => {
          promise.status = "rejected";
          promise.reason = e;
        }
      );
      throw promise;
    }
  });
```

보시다시피 `status`, `value`, `reason` 이라는 값을 따로 받아 Promise 객체를 확장하고 있다. 이는 놀랍게도 Promise에 status라는 프로퍼티가 별도로 존재하지 않아 외부에서 Promise의 상태를 동기적으로 체크할 수 있는 방법이 없기 때문이다.

그래서 [이런](https://github.com/nodejs/node/issues/40054) 제안 같은게 여기저기 존재하고, `use()` RFC에서는 아예 이런 흐름에 대해 사람들이 많이 사용하는 기술이라는 점을 이용하여 tc39에 압박(?)을 넣으려는 [의도](https://github.com/reactjs/rfcs/pull/229#discussion_r994854281)가 엿보이기도 한다. 충분히 Symbol을 사용할 법도 한데 의도적으로 배제한 걸 보면...

아무튼 `const value = use(resource);` 꼴로 사용할 수 있으며, resource에 들어오는 값(Thenable, Context)의 비동기 상태가 풀릴 때까지 상위 컨텍스트로 Suspense 메커니즘을 활용해 비동기 상황을 전파한다. 흔히 `throw Promise`, `try-catch` 등의 문법 구조를 활용하여 설명하는 그것 말이다. 근데 가장 단순하게 설명하자면 React 전용 await 문법이라고 생각하면 된다. `const response = await fetch(url);` 이렇게 쓰는 것과 비슷하다.

여담이지만 엄밀하게는 앞으로 `use()`가 유일한 Suspense 트리거가 될 것으로 보인다. 상술한 이유 때문으로 보이고 좀 더 자세한 내용은 [experimental_use(promise)](https://github.com/facebook/react/pull/25084), [[Flight] Implement FlightClient in terms of Thenable/Promises instead of throwing Promises](https://github.com/facebook/react/pull/25260) 같은 PR을 직접 살펴보는게 좋겠다.

## 의외의 사용처

갑자기 `use()` 얘기는 왜 꺼낸거냐... 물어보신다면 업무를 하다가 생각지 못했던 곳에서 사용하게 되었기 때문이다. 예제 코드를 StackBlitz에 올려놓았으니 [여기](https://stackblitz.com/edit/stackblitz-starters-rvq6wj?file=src%2FApp.tsx)에서 직접 만져볼 수 있다.

사실 코드는 `use()`를 제외하면 아래가 전부다.

```tsx
import { Suspense, useState } from "react";
import { isNull } from "lodash-es";
import { use } from "./use";

export const App = () => {
  const [data, setData] = useState({ text: null });

  return (
    <div>
      <button onClick={() => setData({ text: "Foo!" })}>Resolve</button>
      <Suspense fallback={<div>loading...</div>}>
        <Text data={data} />
      </Suspense>
    </div>
  );
};

const Text = ({ data }: { data: { text: string } }) => {
  isNull(data.text) && use(pendingPromise()); // Here!

  return <div>{data.text}</div>;
};

const pendingPromise = () => new Promise(() => {});
```

자세히 설명하기는 어렵지만, 위와 같은 구현을 떠올리게 된 경위를 간단히 설명해두면 좋겠다. 꽤 깊은 계층 구조를 가진 모달 호출 로직이 있다. 그런데 거기에 polling을 통해 FormData를 데이터를 비동기로 넣어주도록 한 구현이 있었는데 이게 그냥 데이터를 구겨 넣게 되면 모양이 좀 고약해진다.

- Form 데이터

- Form이 Polling 되고 있음을 나타내는 loading 상태

- Polling으로 받아온 데이터를 사용하겠음을 알리는 useState(getter, setter)

- ...

그런데 살펴보니 기존 구현에서 Polling 중일 경우 Form 데이터에 `{ a: null }` 과 같이 로딩 중인 데이터에 대해서는 null 처리를 해주고, 호출이 완료 되었음에도 비어 있는 값은 `{ a: "" }`과 같이 빈 문자열로 처리하도록 되어 있는 것을 발견했다.

암묵적인 규칙이기 때문에 일반적으로 권장할만한 형태는 못되겠지만, 해당 케이스에서는 null일 경우 해당 데이터를 소비하는 곳에서 `use()`로 비동기 상태를 트리거 해주고 이를 Suspense로 감싸도록 구현하면 관련 데이터들을 거추장스럽게 주렁주렁 달고 다니지 않아도 되겠다는 생각이 들었다.

그리고 저런 구현이 가능한 가장 중요한 이유로 `use()`가 조건부 호출이 가능한 유일한 Hook이라는 점을 꼽아야 한다. 너무 기존 Hook이라고 생각할 필요가 없다. 그냥 `await` 같은 개념으로 생각하고, 다만 이 함수의 적용 범위 자체가 React 내부에 국한되므로 이를 표현하기 위해 `use()`라는 이름을 붙였다고 보는게 맞을 듯 하다.

암튼 기능도 잘 동작하고, 비동기를 다루는 로직의 구현도 간결해져서 코드 모양 또한 마음에 든다.

## 여담

2023년도 FeConf 발표였던 [use 훅이 바꿀 리액트 비동기 처리의 미래 맛보기](https://www.youtube.com/watch?v=Hd1JeePasuw&ab_channel=FEConfKorea) 가장 끝 부분에 언급되는데 `use()` 가 최적화 컴파일러인 React Forget에 의해 당초 제안되었던 것보다 운신의 폭이 다소 줄어들 수 있을 것으로 보인다.

공식 문서에서도 언급된 만큼 조건부로 동작하는 것 자체는 유지될 것으로 보이나, 그 외에 일반 함수 내부나 `Array.prototype.map`의 인자로 넘겨지는 iteratee 함수 내부 같은 곳에서는 쓰일 수 있으므로 이 점은 유의해야 할 것 같다.
