---
title: 2023-05-02 React.lazy API 구현 살펴보기
date: 2023-05-02
description: "컴포넌트 동적 import 그거 어떻게 하는건데"
tags: [React, Development]
thumbnail: /thumbnails/hello-world.jpg
---

`React.lazy()`는 React 애플리케이션에서 코드 분할을 쉽게 구현할 수 있는 API입니다. 이를 사용하면 렌더링 시 필요한 컴포넌트만 로드할 수 있어 초기 로딩 시간을 줄일 수 있습니다. `React.lazy()`는 주로 `React.Suspense`와 함께 사용됩니다.

아래는 RFC(https://github.com/reactjs/rfcs/blob/main/text/0064-lazy.md) 의 원문 일부와 그 대목을 번역한 내용입니다. (땡스 DeepL…)

_`React.lazy` adds `first-class` support for code splitting components to React. It takes a module object and returns a special component type._

> `React.lazy`는 React에서 코드 스플리팅 컴포넌트를 `일급(first-class)` 으로 다룰 수 있도록 지원합니다. 모듈 객체를 받아 특별한 컴포넌트 타입을 반환합니다.

_Code splitting is one of the most effective ways to reduce the size of client-side code. It is achievable in React today but it requires either managing state manually or using a library that does it for you. However, even with either of these solutions, the typical user experience isn't ideal._

> 코드 분할은 클라이언트 측 코드의 크기를 줄이는 가장 효과적인 방법 중 하나입니다. 현재 React에서는 코드 분할이 가능하지만, 수동으로 상태를 관리하거나 이를 대신해주는 라이브러리를 사용해야 합니다. 그러나 이러한 솔루션 중 하나를 사용하더라도 일반적인 사용자 경험은 이상적이지 않습니다.

_`React.lazy` accepts a Promise factory, and returns a new component type. When React renders that type for the first time, it triggers the Promise factory (thus, in case of dynamic `import`, starting the request). If the Promise is fulfilled, React reads the `.default` value from it (assuming the resolved value is a module object), and uses it as a component type for rendering. If the Promise is rejected, the rejection is handled in the same way as React normally handles errors (by letting the nearest error boundary handle it). After the code has loaded, React caches the Promise result. Next renders of the components with this type become synchronous and have no extra cost._

> React.lazy는 Promise 팩토리를 수락하고 새로운 컴포넌트 타입을 반환합니다. React가 해당 유형을 처음으로 렌더링할 때, Promise 팩토리를 트리거합니다(따라서 동적 임포트의 경우 요청을 시작합니다). 프로미스가 이행되면, React는 (확인된 값이 모듈 객체라고 가정하고) `.default` 값을 읽어와서 렌더링할 컴포넌트 타입으로 사용합니다. 만약 프로미스가 거부되면, 거부 처리는 React가 일반적으로 에러를 처리하는 것과 같은 방식으로 처리됩니다(가장 가까운 에러 경계가 처리하도록 함으로써). 코드가 로드된 후 React는 Promise 결과를 캐시합니다. 이 유형을 가진 컴포넌트의 다음 렌더링은 동기화되며 추가 비용이 발생하지 않습니다.

아래와 같은 형태로 사용됩니다. About 컴포넌트는 `Suspense`로 감싸지고, 모듈의 로딩이 비동기적으로 완료되었을 때 fallback 대신 본래 컴포넌트가 렌더링 되는 방식입니다.

```jsx
// App.js
import React, { lazy, Suspense } from "react";

const About = lazy(() => import("./About"));

// Example
<Suspense fallback={<Spinner />}>
  <About />
</Suspense>;
```

그러므로 `lazy`의 구현은 대략 다음과 같이 어떠한 컴포넌트를 리턴하는 형태가 될 것입니다. GPT에게 부탁하여 뽑아본 간단한 implementation 코드입니다.

```jsx
function lazy(loader) {
  return function LazyWrapper(props) {
    return <LazyComponent {...props} loader={loader} />;
  };
}
```

해당 컴포넌트는 외부로부터 loader라는 모듈을 로딩해오는 함수를 전달 받아 실행시킬 것이고, 이 함수의 실행이 완료되었을 때 불러온 모듈로부터 default 를 가져오고, 그걸 컴포넌트로서 보여줍니다.

당연하게도 모듈 로더로는 첫 예시코드에서 보았듯 `import()` 가 사용되고 있습니다. 동적 import는 ECMA2015에서 추가된 스펙이며, `type=”module”` 이 없어도 가능합니다. ESM의 정적 import와도 거리가 있습니다. 참고로 동적 import는 함수가 아니고 `super()` 와 같은 별개의 문법 요소입니다.

```jsx
class LazyComponent extends React.Component {
  constructor(loader) {
    super();
    this.state = {
      // 실제로는 Suspense 관련 구현이 들어갈 것 (Promise)
      component: null,
    };
    this.loader = loader;
  }

  componentDidMount() {
    this.loader().then((module) => {
      this.setState({
        component: module.default,
      });
    });
  }

  render() {
    const { component: LoadedComponent } = this.state;
    return LoadedComponent ? <LoadedComponent {...this.props} /> : null;
  }
}
```

ES6 미만의 환경에서는 이 기능을 사용하기 위해 Babel의 도움을 받고 있을 것으로 예상할 수 있습니다.

Babel에는 `@babel/plugin-syntax-dynamic-import`(https://babeljs.io/docs/babel-plugin-syntax-dynamic-import) 라는 플러그인이 존재하는 군요. 근데 세부 구현을 찾을 수가 없어서 `babel-plugin-dynamic-import-node`(https://github.com/airbnb/babel-plugin-dynamic-import-node/blob/master/src/index.js) 도 링크 추가해둡니다.

```js
// input
var modP = import("mod");
// output (CJS)
var modP = Promise.resolve().then(() =>
  babelHelpers.interopRequireWildcard(require("mod"))
);
// output (AMD)
define(["require"], function (_require) {
  var modP = new Promise((_resolve, _reject) =>
    _require(
      ["mod"],
      (imported) => _resolve(babelHelpers.interopRequireWildcard(imported)),
      _reject
    )
  );
});
```

동적 import가 정말 어떻게 일어나는지 잘 모르겠어서 좀 더 찾아봤습니다. 실제 tc39 동적 import RFC에서 예시로 들었던 코드입니다. 특정 호스트에 종속적이고 url을 절대 경로로 넣어야 하지만 대략 저런 느낌으로 동적 import를 할 수는 있겠습니다. 좋은 예시는 아니라네요.

```js
// https://github.com/tc39/proposal-dynamic-import#using-host-specific-mechanisms
function importModule(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const tempGlobal =
      "__tempModuleLoadingVariable" + Math.random().toString(32).substring(2);
    script.type = "module";
    script.textContent = `import * as m from "${url}"; window.${tempGlobal} = m;`;

    script.onload = () => {
      resolve(window[tempGlobal]);
      delete window[tempGlobal];
      script.remove();
    };

    script.onerror = () => {
      reject(new Error("Failed to load module script with URL " + url));
      delete window[tempGlobal];
      script.remove();
    };

    document.documentElement.appendChild(script);
  });
}
```

다시 React 맥락으로 돌아와보겠습니다. React 코드 베이스에서 확인할 수 있는 `React.lazy()`의 코드는 생각보다 길지 않습니다. 전체 코드를 가져와보겠습니다.

```tsx
// https://github.com/facebook/react/blob/main/packages/react/src/ReactLazy.js
import type { Wakeable, Thenable } from "shared/ReactTypes";

import { REACT_LAZY_TYPE } from "shared/ReactSymbols";

const Uninitialized = -1;
const Pending = 0;
const Resolved = 1;
const Rejected = 2;

// 타입 관련 코드 생략

function lazyInitializer<T>(payload: Payload<T>): T {
  if (payload._status === Uninitialized) {
    const ctor = payload._result;
    const thenable = ctor(); // ctor = ConstrucTOR 인듯 ㅋㅋㅋ
    // Transition to the next state.
    // This might throw either because it's missing or throws. If so, we treat it
    // as still uninitialized and try again next time. Which is the same as what
    // happens if the ctor or any wrappers processing the ctor throws. This might
    // end up fixing it if the resolution was a concurrency bug.
    thenable.then(
      (moduleObject) => {
        if (payload._status === Pending || payload._status === Uninitialized) {
          // Transition to the next state.
          const resolved: ResolvedPayload<T> = (payload: any);
          resolved._status = Resolved;
          resolved._result = moduleObject;
        }
      },
      (error) => {
        if (payload._status === Pending || payload._status === Uninitialized) {
          // Transition to the next state.
          const rejected: RejectedPayload = (payload: any);
          rejected._status = Rejected;
          rejected._result = error;
        }
      }
    );
    if (payload._status === Uninitialized) {
      // In case, we're still uninitialized, then we're waiting for the thenable
      // to resolve. Set it as pending in the meantime.
      const pending: PendingPayload = (payload: any);
      pending._status = Pending;
      pending._result = thenable;
    }
  }
  if (payload._status === Resolved) {
    const moduleObject = payload._result;

    // 개발 환경 분기 생략
    return moduleObject.default;
  } else {
    throw payload._result;
  }
}

export function lazy<T>(
  ctor: () => Thenable<{ default: T, ... }>
): LazyComponent<T, Payload<T>> {
  const payload: Payload<T> = {
    // We use these fields to store the result.
    _status: Uninitialized,
    _result: ctor,
  };

  const lazyType: LazyComponent<T, Payload<T>> = {
    $$typeof: REACT_LAZY_TYPE,
    _payload: payload,
    _init: lazyInitializer,
  };

  // 개발 환경 분기 생략

  return lazyType;
}
```

실제로도 lazy()는 React 컴포넌트를 리턴하고 있고, lazyInitializer는 `thenable`을 리턴하고 있습니다. RFC에서 언급됐던 `Promise 팩토리` 가 `ctor(ConstrucTOR)` 인가보네요.

RFC에서 확인할 수 있었듯 성공 시 모듈의 default 객체를, 실패 시 결과물을 throw 하여 상위의 `ErrorBoundary`에서 처리하도록 대수적 효과를 발생시키고 있습니다. 아직 성공 / 실패 상태가 결정되지 않았을 때는 초기값인 Pending 상태인 thenable을 사용하도록 하고 있고요. 어색하게 보이겠지만 then 메서드는 원래 인자를 두개 받습니다. catch도 기본적으로는 `then(undefined, onRejected)` 인거고요.

최종적으로 리턴된 React 컴포넌트인 lazyType은 React 내부의 가상돔으로 넘겨진 다음 렌더링 중 적절한 시점에 \_init을 실행하게 되겠군요.

여담으로 `thenable`은 `.then()` 메서드를 가지고 있는 자바스크립트 객체입니다. `.then()` 메서드는 Promise 객체에도 존재하며, 비동기 작업이 완료되었을 때 호출할 콜백 함수를 등록하는 데 사용됩니다.

thenable 객체는 일반적으로 Promise 객체와 유사한 동작을 제공하지만, Promise의 프로토타입 체인에 속하지 않는 객체일 수도 있습니다. 이 사실이 익숙하지 않다면 이터러블 프로토콜(`Symbol.Iterator`)을 구현하는 객체를 직접 구현하는 경우를 생각해봐도 되겠습니다.

thenable 객체를 사용하면 Promise와 호환되는 커스텀 비동기 동작을 구현할 수 있습니다. 물론 이 객체 자체가 Promise인 것은 아니므로 내부적으로 상태를 가지는 `상태 기계(state machine)`가 될 수는 없겠죠.

```js
const thenable = {
  then: function (onFulfilled) {
    setTimeout(() => {
      onFulfilled("Hello, thenable!");
    }, 1000);
  },
};

thenable.then((value) => {
  console.log(value); // 출력: "Hello, thenable!"
});
```

다시 곰곰 생각해보니 React.lazy가 나오기 전에는 `loadable-components` (https://github.com/gregberge/loadable-components) 를 사용하였고, 기억으로는 구버전 공식 문서에서도 추천해주고 있던 라이브러리 였던걸로 기억해서 이쪽 구현을 찾아봐도 좋겠네요. 다만 기본적인 컨셉은 지금까지 살펴본 바와 동일합니다.

일단 loadable-components의 공식 문서에 따르면 loadable-components와 React.lazy에는 다음과 같은 차이가 존재하며 상황에 맞게 사용하면 되겠습니다.

<img src="https://file.notion.so/f/s/b8e0b24b-5ac0-4c8d-9530-c240971efe42/Untitled.png?id=7058c4a6-961d-4fdb-8ecb-d105e6fc48cf&table=block&spaceId=7a813495-7f43-4f9b-8425-adb83564ac6f&expirationTimestamp=1683209292759&signature=UKQVOQLYB9EGhiCgWfdb-w9gnOKVjm44AD3qnqGck7w&downloadName=Untitled.png" alt="image" style="zoom:50%;" />
