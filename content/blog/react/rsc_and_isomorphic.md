---
title: 2023-10-24 "처음부터 RSC가 있었으면 됐잖아?"
date: 2023-10-24
description: 왜 처음부터 안 넣어서 이 사단을 만드냐? (그런거 아님;)
tags: [React, Nextjs, Development, RSC, React Server Components, Isomorphic]
thumbnail: /thumbnails/hello-world.jpg
---

## 생각해보면 이 모든 건 RSC가 처음부터 있었으면 됐을 일이다

진짜 그렇죠. 만약 처음부터 `React Server Components`(이하 RSC)가 있었다면, 'RSC는 Client Components를 해치지 않아요' 'RSC는 React를 변화시키는게 아니라 오히려 완전하게 만드는 거에요' 같은 궁색한 설명들을 안해도 됐을 겁니다. 하지만 어쨌든 RSC는 2023년 Next.js를 등에 업고 React 생태계에 핵폭탄처럼 떨어졌고, 많은 혼란과 오해를 낳는 중입니다.

굳이 그 카오스 속에 숟가락을 얹어 업보를 쌓기 보다는, 약간 각도를 바꿔 '왜 처음부터 RSC가 포함되지 않았을까?'에 대한 제 나름의 (합리적) 추론을 늘어놔 보려고 합니다.

## Isomorphic Components

RSC에 대해 이야기 해보겠습니다. 다만 제가 이해한 방식으로 다시 소화해서 설명해보겠습니다. 정말 많은 자료들 속에서 나만의 설명을 찾기 위해서는 우선 이 개념에 대해 ‘한 줄 설명’을 시도해봐야 합니다. RSC란 뭘까요?

> React Server Components란 1) 서버에서만 실행되는 컴포넌트이며, 2) 결과 값이 HTML이 아닌 JSX인 렌더링 프로세스이기도 하다.

우선 ‘서버에서만 실행되는 컴포넌트’라는 건 무슨 뜻일까요? 기존 Next.js `Page Router`까지의 React 컴포넌트도 서버에서 실행되었다고 볼 수 있지 않을까요? 맞는 말이기도 하지만 정확하게 서버에서만 실행되는 컴포넌트는 아니었습니다.

Page Router의 React 컴포넌트는 서버에서도, 클라이언트에서도 동일하게 동작해야 합니다. 프로그래밍 분야에서 이러한 로직을 `Isomorphic(동형)` 이라고 부릅니다. 아래와 같은 예시를 생각해보겠습니다.

```tsx
import { useEffect, useLayoutEffect } from "react";

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
```

Next.js에서 `useLayoutEffect`를 사용할 때는 주의해야 합니다. 왜냐하면 useLayoutEffect는 서버 환경에서 실행되지 않기 때문이죠. 그렇다고 `useEffect`가 아예 실행되지 않는 건 곤란하니 삼항연산자로 서버 환경일 경우 useEffect로 동작하도록 처리합니다. 동형 컴포넌트라는 제약을 잘 지켜냈다고 볼 수 있겠군요.

약간의 어려움은 있었지만 이정도면 썩 나쁘지 않게 처리가 된 것 같습니다. 그렇다면 이건 어떨까요?

```tsx
import db from "db";
import NoteEditor from "NoteEditor";

async function Note({ id, isEditing }) {
  const note = await db.posts.get(id);

  return (
    <div>
      <h1>{note.title}</h1>
      <section>{note.body}</section>
      {isEditing && <NoteEditor note={note} />}
    </div>
  );
}
```

DB에 직접 액세스 하는 코드가 있습니다. 이 코드는 Node.js 서버 측 환경에 강하게 결합되어 있기 때문에 클라이언트 쪽에서 실행될 수 없습니다. `useIsomorphicLayoutEffect` 같은 트릭을 사용해 우회하고 싶어도 `fs` 같은 API는 브라우저에 아예 존재하지 않으니까요.

이제 난관에 봉착했습니다. 어떻게 하죠?

## "Isomorphic was the new black"

아니, 애초에 왜 이런 부조리해보이는 Isomorphic 컴포넌트 설계를 도입한걸까요? 이에 대해 찾아보던 중 2015년, [React 초기 시점에 작성된 한 기사](https://www.smashingmagazine.com/2015/04/react-to-the-future-with-isomorphic-apps/)를 발견했고 실마리를 얻었습니다.

2015년은 `ECMAScript 2015`(ES6)이 발표되었던 시기입니다. React는 2013년에 오픈소스로 공개되었고 시장에서 인기를 얻기 시작했습니다. 흥미롭게도 Isomorphic 컴포넌트도 그 장점 중 하나로 어필이 되었습니다. 우리가 지금 의아함을 겪고 있는 것과는 다르게 말이죠.

여기서부터는 일정 부분 추측의 영역입니다. 잠시 2015년으로 돌아가봅시다.

여러분이 한 중소기업에 입사했습니다. 웹 개발 시장에서 클라이언트 개발에는 `CSR`이 강세인 상황입니다. 여러분은 당시 인기 있던 `AngularJS`(앵귤러 1)을 큰 고민 없이 골랐습니다. 아래와 같은 코드겠네요.

```html
<!-- index.html -->
<!DOCTYPE html>
<html ng-app="myApp">
  <head>
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.7.2/angular.min.js"></script>
    <script src="app.js"></script>
  </head>
  <body>
    <div ng-controller="MyController">{{ message }}</div>
  </body>
</html>
```

```js
// app.js
angular.module("myApp", []).controller("MyController", function ($scope) {
  $scope.message = "Hello, World!";
});
```

조금 어색하실 수도 있겠지만 간단하게 흐름을 짚어보겠습니다.

- 유저가 서버로 GET 요청을 보냅니다.

- 서버는 index.html을 응답하고, 브라우저에는 head 태그 내 script 태그를 파싱하여 앵귤러 라이브러리 코드와 여러분이 작성한 app.js를 다운로드 받습니다. 이 시점에 화면에는 `{{ message }}` 가 렌더링 됩니다.

- JavaScript가 로드 되고 `ng-app` 와 `ng-controller` 를 찾아 여러분의 코드가 DOM과 연결됩니다. `ng-controller=’MyController’` 가 하나의 `$scope` 로 전달되고 그 안쪽에 머스태쉬 문법으로 작성된 `message` placeholder를 `‘Hello, World!’` 로 교체합니다.

- CSR이 끝나고 유저의 화면에서 페이지가 완성되어 보입니다.

이 구조는 HTML과 JavaScript라는 서로 다른 두 가지 멘탈 모델을 하나의 페이지에 섞어 사고하기를 요구합니다. React에 익숙한 우리 입장에서는 작성하기에 따라 복잡할 수도 있겠다는 생각이 듭니다.

하지만 진짜 문제는 이제 시작입니다. 기능은 완성했는데 SEO 점수가 좋지 않다며 팀장이 서버 사이드 렌더링을 도입하라고 지시했습니다. 놀랍게도 AngularJS에서는 SSR을 지원하지 않았습니다.

여러분은 서버 역할을 할 기술을 찾아보았고 `루비 온 레일즈(Ruby On Rails)`라는 풀스택 프레임워크를 찾았습니다. 슬픈 사실은 루비 온 레일즈는 SSR은 가능하지만 CSR은 불가능하다는 점이죠.

작전은 이렇습니다. **1) 첫 요청은 루비 온 레일즈로 구워서** 보내주고 **2) CSR은 AngularJS로 지원**한다!

루비 온 레일즈는 전용 템플릿 언어(ERB, Embedded Ruby)를 사용합니다. 템플릿은 ERB로 작성하고 템플릿을 굽는 로직은 루비를 사용하는 것이죠.

```html
<!-- ERB 예시 -->
<h1>Welcome, <%= @user.name %></h1>
```

이 템플릿 파일 하단에 다음과 같은 스크립트를 추가하고 앵귤러 쪽에서도 이 코드를 읽어올 수 있도록 코드를 추가합니다. 일반적으로 SSR을 구현할 때 사용하는 개념과 동일합니다.

```html
<script>
  window.__INITIAL_DATA__ = <%= @initial_data.to_json.html_safe %>;
</script>
```

```js
// AngularJS application
angular.module("myApp", []).controller("MyController", function ($scope) {
  $scope.data = window.__INITIAL_DATA__;
});
```

서버 측 SSR용 ERB 템플릿, 클라이언트 측 CSR 용 템플릿을 번갈아가면서 쓴다! 벌써 어질어질 합니다. 방법이 없을까요?

```jsx
import React from "react";

const App = ({ name }) => <div>Hello, {name}!</div>;

export default App;
```

우리는 이미 어떤 기술이 살아 남았는지 알고 있습니다. React는 이러한 기술적인 환경 속에서 JSX를 통해 서버 / 클라이언트 로직을 동형으로 만들어 개발자가 간단하게 클라이언트와 서버 로직을 작성하도록 돕고 컴포넌트의 재활용성을 높였습니다.

동형 모델로 멘탈 모델을 간결하게 만들 수 있다는 구호가 셀링 포인트가 되고 있는 상황에서 애매하게 서버 컴포넌트를 제공하는 건 그다지 매력적인 포지셔닝이 아니었을지도 모릅니다. 하나의 언어로 동형 컴포넌트를 쓸 수 있다는데 컴포넌트에서 서버 로직 접근 못하는 것 쯤이야?

그러니까 지금까지의 SSR은 이러한 제약을 받아들이면서 진정한 서버 렌더링이 아닌 `Client Prerendering` 으로 불리는 것이 맞다는 주장이 나오기도 했고, 일견 합당해보입니다. 저는 좀 더 용어를 엄밀히 쓸 수 있다면 `Server Only Components`와 `Isomorphic Components`로 구분하는 것이 좋을 것 같습니다. 의미도 더 명확하고요.

그 동안 이 설명의 연결고리가 빠지니 RSC가 하늘에서 뚝 떨어진 것처럼 보였지만 이제야 제 자리를 찾은 느낌입니다. 이제 역사의 시계는 한바퀴 돌아 제자리로 돌아왔습니다.

## 오래된 미래, Suspense & React Server Components

슬슬 이야기가 결말을 향해 가고 있는데요. 잠시 Suspense 얘기로 빠져보겠습니다.

페이스북에서는 `BigPipe`라는 기술을 사용해 웹 페이지 로딩을 최적화 해왔습니다. [BigPipe](https://engineering.fb.com/2010/06/04/web/bigpipe-pipelining-web-pages-for-high-performance/)는 웹 페이지를 여러 `페이지릿(pagelet)`으로 나누고, 각 페이지릿이 독립적으로 로드되고 렌더링될 수 있게 함으로써 전체 페이지 로딩 시간을 줄일 수 있었습니다.

![https://engineering.fb.com/2010/06/04/web/bigpipe-pipelining-web-pages-for-high-performance/](https://engineering.fb.com/wp-content/uploads/2010/06/Fmf_DABbchelnvIBADCNcQduPQkAAAE.jpg)

페이지릿이란 웹 페이지의 한 부분으로, 일반적으로 하나 이상의 컴포넌트로 구성되며 독립적으로 렌더링될 수 있습니다. BigPipe는 각 페이지릿이 비동기적으로 렌더링될 수 있게 하여, 서버에서 클라이언트로 페이지의 일부분을 빠르게 스트리밍할 수 있게 합니다. 음… 이거 어디서 들어본 이야기 아닌가요? ㅎㅎ

그렇습니다. BigPipe는 `Suspense`와 `Streaming SSR`의 선행 기술입니다. 실제로 위에 링크된 BigPipe의 Streaming SSR 아티클 내용을 잘 살펴보면 React 18 버전에서 구현된 `renderToPipeableStream`과 같은 구조로 스트리밍 하고 있음을 확인할 수 있습니다.

요약하면 placeholder를 포함한(React 18 기준으로는 '서스펜스 경계') 미완성 페이지를 먼저 렌더링 하고, 후속 청크에서 이 placeholder 부분을 replace 하는 로직이 포함된 script 태그 덩어리를 후속 통신으로 받아 추가 렌더링하는 기법입니다.

> The tag includes BigPipe’s JavaScript library to interpret pagelet responses to be received later. In the tag, there is a template that specifies the logical structure of page and the placeholders for pagelets. For example:

```html
<p><div id=”left_column”> <div id=”pagelet_navigation”></p></p><div id=”middle_column”> <div id=”pagelet_composer”></p><div id=”pagelet_stream”></p></p><div id=”right_column”> <div id=”pagelet_pymk”></p><div id=”pagelet_ads”></p><div id=”pagelet_connect”></p></p></p>
```

> After flushing the first response to the client, web server continues to generate pagelets one by one. As soon as a pagelet is generated, its response is flushed to the client immediately in a JSON-encoded object that includes all the CSS, JavaScript resources needed for the pagelet, and its HTML content, as well as some meta data. For example:

```js
<script type="text/javascript"> big_pipe.onPageletArrive({id: “pagelet_composer”, content=<HTML>, css=[..], js=[..], …}) </script>
```

> At the client side, upon receiving a pagelet response via “onPageletArrive” call, BigPipe’s JavaScript library first downloads its CSS resources; after the CSS resources are downloaded, BigPipe displays the pagelet by setting its corresponding placeholder div’s innerHTML to the pagelet’s HTML markup.

이제 다시 RSC로 돌아와보겠습니다.

앞에서 이야기 나누었다시피 여전히 동형 컴포넌트는 존재하고, 다만 여기에 `서버 전용(Server-Specific)` 컴포넌트가 추가되었습니다. Dan Abramov는 RSC는 기존 React의 어떤 부분을 죽이는 것이 아니라 오히려 완전하게 만든다고 주장합니다. 아래 그림은 RSC가 기존 React의 멘탈 모델을 변경한 것이 아니라 확장된 것임을 강조하는 개념도 입니다. (https://github.com/reactwg/server-components/discussions/4)

![rsc](https://user-images.githubusercontent.com/810438/242759983-7b94cb4e-a46e-41a8-b73f-954a39550599.png)

이 RSC 라는 개념이 어떤 역사적 흐름 속에서 발전해왔는지에 대한 [Dan의 트윗 스레드](https://twitter.com/dan_abramov/status/1648830869304426500)를 기반으로 이야기를 이어나가 보겠습니다.

Dan의 설명에 따르면 초기 프론트엔드 개발은 뷰와 컨트롤러를 분리하여 관리하는 것이 일반적이었다고 합니다. 앞서 살펴보았던 AngularJS의 코드가 `MVC(Model - View - Controller)` 패턴으로 작성되어 있다고 볼 수 있겠네요. 물론 그 형태는 사뭇 다르지만 지금도 `화면`과 `비즈니스 로직`을 분리하는 패턴이 권장되고 있기도 하고요.

하지만 초기의 페이스북 서버 코드는 `XHP`(PHP에서 XML 구문을 쉽게 작성하고 처리하기 위한 확장 언어)라는 기술로 작성되어 있었습니다. 이는 JSX와 많은 공통점을 가지고 있었습니다.

아래 코드를 보시죠. `my-component` 라는 새로운 XHP 컴포넌트를 정의하는 예시입니다.

```php
<?hh // strict

final class :my-component extends :x:element {
  attribute string name @required;

  protected function render(): XHPRoot {
    $name = $this->:name;
    return <div>Hello, {$name}</div>;
  }
}
```

그리고 아래와 같이 컴포넌트를 사용하면 “Hello, World”라는 메시지를 출력합니다.

```php
echo <my-component name="World" />;
```

이는 컴포넌트 중심의 멘탈 모델이며, 선언적으로 UI를 정의하고, props를 전달하고 있습니다. 충분히 JSX의 전신이었다고 평가할 수 있겠습니다.

하지만 아직 우리가 생각하는 현대 React와는 거리가 있습니다. 한 번 트리를 렌더링하면, HTML로 렌더링되었기 때문에 페이지를 불러오지 않고는 다시 렌더링할 수 없었습니다. 서버 사이드에서 HTML을 1회성으로 구워서 내려줄 뿐이므로 당연한 얘기죠? 그래서 React가 점차 클라이언트 - 서버 양쪽을 모두 "먹어치우기" 전까지는 그 역할이 클라이언트에 "인계"되었습니다(Client Side Rendering).

## 마무리

결론적으로 `Suspense`와 `RSC` 모두 과거에 페이스북에서 사용하던 기술들을 기반으로 현대화한 것입니다. 그리고 이 기술들은 모두 처음부터 계획되었다기 보다는, 어떠한 필요를 메우기 위해 여러 시도 끝에 탄생한 것입니다.

Suspense는 React SSR에 BigPipe 아키텍처를 가져오기 위해 설계된 것이 맞습니다. 그러나 React Core 팀이 서버에서 데이터를 어떻게 가져올지에 대한 방법을 아직 몰랐기 때문에, 먼저 클라이언트에서 출시하게 된 것입니다. 서버 데이터 패칭에 대해 더 고민하면서 이것이 앞서 언급한 과거의 XHP 스택과 더 유사하게 작동해야 한다는 것을 깨달았고, 그 결과 `React Server Components(RSC)`가 탄생하게 되었다는 설명이 좀 더 정확합니다.

정리하자면, 페이스북에서 XHP는 서버용 MVC의 원래 대안이었고, React는 클라이언트용 MVC의 대안이었습니다. 비록 기술적으로는 다르지만, 그 정신은 비슷했습니다. 이러한 작업은 대략 [2019년 쯤 부터 React Flight라는 코드네임으로 진행](https://twitter.com/dan_abramov/status/1193001108102373376?ref_src=twsrc%5Etfw%7Ctwcamp%5Etweetembed%7Ctwterm%5E1193001108102373376%7Ctwgr%5Edb15298c3d3587da3cb82f9489113a0d1da293f5%7Ctwcon%5Es1_&ref_url=https%3A%2F%2Fwww.notion.so%2Foj8mm%2F4-2-React-Server-Component-App-Router-c0ece3269d12456cba70023ad2d99ef1)되어 왔던 것으로 보입니다. 이제 남아 있던 마지막 퍼즐이 맞춰지며 서버용 MVC - 클라이언트용 MVC 모델이 React 18에 이르러 합쳐지는 순간을 맞았습니다. 여러 가지 과거의 유산들을 현재로 다시 불러오면서 서버와 클라이언트 사이 끊긴 다리를 잇는데 성공한 것입니다.

먼길 돌아온 제자리 같은 느낌도 들지만 저는 개인적으로 "RSC는 PHP로의 회귀다" 라는 표현에 동의하지는 않습니다. 다만 글이 너무 길어졌으므로 여기서 한번 끊고, 다음에 기회가 된다면 더 자세히 이야기 나눠보도록 하겠습니다. 긴 글 읽어주셔서 감사합니다.
