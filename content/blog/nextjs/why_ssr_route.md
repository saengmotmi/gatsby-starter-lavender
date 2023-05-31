---
title: 2023-06-01 Next.js의 SSR은 왜 페이지 단위로만 가능할까?
date: 2023-06-01
description: 그러게...?
tags: [React, Nextjs, Development]
thumbnail: /thumbnails/hello-world.jpg
---

`Next.js의 SSR은 왜 페이지 단위로만 가능할까?` 라는 질문은 다소 넌센스 적으로 느껴질 수도 있다. 생각하기에 따라 다양한 층위에서 정답이 가능하기 때문이다.

- Next.js는 프레임워크이고, 페이지 단위 SSR은 Next.js에서 규정한 방식이기 때문이다.
- Next.js의 SSR 렌더링 단위와 라우터 구조가 서로 강결합 되어 있기 때문이다.
- Next.js가 페이지 단위로 SSR을 한다는 전제 자체가 잘못되었다.

이런 식으로 말이다. 모순되어 보이지만 세 답변 모두 정답이다. 하지만 첫 번째 답변은 더 이상의 질문을 던지지 않기 때문에 의미가 없다. 세 번째 질문은 Next.js 13 버전의 App Router 도입 후의 RSC에 대한 설명이므로 조건부로 정답이다. 이번 글에서는 내부 구현을 기반으로 두 번째 질문에 대해 부연설명 해볼 예정이다. Next.js 12버전 이하의 `Page Router` 구조와 `SSR`이 어떤 관계를 가지고 있는지 알아보자. (13 버전에 대해서는 다음 기회에 알아보자.)

<br>

## react-router-dom이 없는 세상

Next.js를 처음 접해본 사람들이 가장 당황하는 부분은 바로 `react-router-dom`이 없다는 것이다. Next.js는 자체적으로 라우터를 제공하기 때문에 `react-router-dom`을 사용할 필요가 없다. Next.js의 라우터는 `pages` 디렉토리 내의 파일 구조를 기반으로 동작한다. `pages` 디렉토리 내의 파일 구조는 다음과 같다.

```bash
pages
├── _app.js
├── _document.js
├── index.js
├── about.js
└── posts
    ├── index.js
    ├── [id].js
    └── [category].js
```

이 중 `_app.js`, `_document.js`는 Next에서 특수한 기능을 담당하는 파일이다. `_app.js`는 `pages` 디렉토리 내의 모든 페이지에서 공통으로 사용되는 컴포넌트를 정의하는 파일이다. `_document.js`는 `pages` 디렉토리 내의 모든 페이지에서 공통으로 사용되는 HTML 문서를 정의하는 파일이다. `_app.js`와 `_document.js`에 대한 자세한 설명은 [공식문서](https://nextjs.org/docs/advanced-features/custom-app)를 참고하자.

`index.js`, `about.js`, `posts/index.js`, `posts/[id].js`, `posts/[category].js`는 모두 라우터를 정의하는 파일이다. `index.js`는 `/` 경로로 접근했을 때 렌더링되는 페이지를 정의한다. `about.js`는 `/about` 경로로 접근했을 때 렌더링되는 페이지를 정의한다. `posts/index.js`는 `/posts` 경로로 접근했을 때 렌더링되는 페이지를 정의한다. `posts/[id].js`는 `/posts/:id` 경로로 접근했을 때 렌더링되는 페이지를 정의한다. `posts/[category].js`는 `/posts/:category` 경로로 접근했을 때 렌더링되는 페이지를 정의한다.

하지만 곰곰 생각해보면 이런 코드들은 그 자체로는 그냥 자바스크립트 파일일 뿐 어떤 마법을 부리는 존재들이 아니다. 결국 Next.js 내부의 어떤 동작들로 인해 동작하게 되는 것이고, 이 쯤에서 `프레임워크`에 대해 설명해야 한다.

<br>

## 프레임워크와 라이브러리

`프레임워크(Framework)`란 무엇일까? 아니면 `라이브러리(Library)`란 무엇인가? 같은 질문은 어떨까?

Next.js를 처음 처음 접했을 때 가장 당황스러웠던 부분은 도대체 **‘이게 어떻게 돌아가는지 도대체 알 수가 없다’**였다. 물론 React를 처음 공부하기 시작했을 때 느끼는 감정 또한 비슷한 문구로 표현할 수 있겠지만 생각해보면 조금 다른 맥락의 ‘알 수 없음’임을 알아챌 수 있다.

React가 우리가 보는 화면을 그리는 실질적인 코드는 아래와 같은 한 줄 때문이고, 심지어 지우면 빈 HTML만 열리는 걸 확인할 수도 있다.

```tsx
ReactDOM.createRoot().render(document.getElementById("root"), <App />);
```

하지만 Next.js는 다르다. 너무 많은 것들이 숨겨져 있어서 분명 우리가 작성하는 건 React 코드이긴 한데, React를 잘 알아도 코드가 어디서 시작하는지는 확인할 수 없다. `react-router-dom` 을 깔지도 않았는데 라우팅이 저절로 일어난다. 도대체 왜 라우트는 `pages` 이하의 폴더에 작성해야 하는걸까? `api` 폴더 이하에 있는 파일들은 왜 API가 되는걸까?

또한, `_app.js` 나 `_document.js` 같은 파일들이나 `getServerSideProps` 같은 함수들이 사용된다는 건 문서를 보고 알 수 있지만, 그것들이 어디에서 어떻게 이용되는지 알 수 없다.

이것이 바로 프레임워크의 특징이다. 라이브러리를 사용할 때는 우리가 라이브러리를 불러와서 사용하지만, 프레임워크를 사용할 때는 우리가 작성한 코드를 프레임워크가 가져가서 대신 실행시켜준다.

비유를 들어보자면 연필은 라이브러리이고, 프린터는 프레임워크다. 전자의 경우 ‘필기한다’는 목적 아래 내가 ‘연필’이라는 도구를 ‘선택‘하여 원하는 방식으로 사용할 수 있다. 필기하는 행위의 주도권이 사용자인 나에게 있다. 연필이 마음에 들지 않으면 언제든 다른 필기구로 갈아탈 수도 있다.

반면 프린터의 경우 필기한다는 목적을 위해 내가 선택할 수 있는 것이 없다. 물론 프린터를 선택한건 나이고, 옵션을 설정하여 여러가지 변경을 줄 수는 있다. 다만 프린터 내부 작동 방식에 손을 댈 수는 없고, 옵션으로 주어진 것도 프린터가 허용하는 범위 내에서 선택할 수 있다.

우리가 할 수 있는 건 프린터가 허용하는 방식으로 입력을 주고 프린터가 허용하는 방식의 출력을 받아보는 것 뿐이다. 이런 제약을 감내하고 준수한 결과를 편리하게 받아볼 수 있는 데서 프레임워크의 효용이 있다고 할 수 있겠다.

<br>

## 다시 Next.js로

이야기가 잠시 돌았는데, 다시 React와 Next.js의 이야기로 돌아와 라우트를 살펴보자. 사실 그 라우터라는게 사실 그렇게 엄청나게 대단한 건 아니다. 그냥 대신 구현을 해두었다는게 의미가 있을 뿐.

```tsx
// 폴더 구조로 라우트 구성하기 - 컨셉 코드
const pages: Record<string, { default: React.ElementType }> = import.meta.glob(
  "./pages/*.tsx",
  { eager: true }
);

const routes = Object.keys(pages).map((path) => {
  const name = path.match(/\.\/pages\/(.*)\.tsx/)?.[1] ?? "";
  return {
    name,
    path: `/${name === "index" ? "" : name}`,
    component: pages[path].default,
  };
});

const container = document.getElementById("root") as HTMLElement;

ReactDOM.createRoot(container).render(
  <Router>
    {routes.map(({ path, component: Component }) => (
      <Route key={path} path={path} component={<Component />} />
    ))}
  </Router>
);
```

이러한 코드를 머릿속에 넣고 다시 Next.js의 코드를 보면, 어떤 동작을 하는지 이해할 수 있을 것이다. `_app.js`나 `_document.js`의 특수함은 미리 예약된 파일명을 가지고 분기를 태우는 것이고, `getServerSideProps`이나 `getInitialProps`와 같은 함수들 또한 pages에 불러온 모듈의 export를 들여다보고 미리 예약해둔 이름의 함수가 있으면, 그 함수를 실행시키는 것이다.

아래 컨셉 코드를 살펴보자. 가장 간단한 SSR을 구현한다면 프론트엔드 페이지를 서빙하는 서버는 대략 이런 형태일 것이다.

```tsx
import React from "react";
import ReactDOM from "react-dom/server";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import About from "./src/pages/about";
import { getByteLengthByUTF8 } from "./src/utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 서버 재시작하면 cache 날아감
const cache: { [path: string]: string } = {};

app.use("/assets", express.static("dist/assets"));

app.get("*", (req, res) => {
  let indexHTML = fs.readFileSync(
    path.resolve(__dirname, "dist/index.html"),
    "utf8"
  );
  const currentPath = req.path;
  const cachedHTML = cache[currentPath];

  const ssrPaths = ["/about"]; // about 페이지에만 SSR 적용
  const isSSR = ssrPaths.includes(currentPath);

  if (isSSR && !cachedHTML) {
    const result = ReactDOM.renderToString(<About />);
    const initialData = { name: "ssr" };

    indexHTML = indexHTML
      .replace(
        '<div id="root"></div>', // replace the placeholder
        `<div id="root">${result}</div>` // replace with the actual content
      )
      .replace("__DATA_FROM_SERVER__", JSON.stringify(initialData)); // head script에 server 측 주입

    cache[currentPath] = indexHTML;
  }
  if (cachedHTML) {
    console.log({ length: getByteLengthByUTF8(cachedHTML) });
    return res.status(200).send(cachedHTML);
  }
  return res.status(200).send(indexHTML);
});

app.listen(5500, () => {
  console.log("Server started on http://localhost:5500");
});
```

여기서 `getInitialProps`를 실행하는 코드를 추가한다면 형태는 대략 이럴 것이다. (`preRenderedProps` 참고)

```ts
// ...
if (isSSR && !cachedHTML) {
  const result = ReactDOM.renderToString(<About />);
  const initialData = { name: "ssr" };
  const preRenderedProps = await About.getServerSideProps(initialData);

  indexHTML = indexHTML
    .replace(
      '<div id="root"></div>', // replace the placeholder
      `<div id="root">${result}</div>` // replace with the actual content
    )
    .replace("__DATA_FROM_SERVER__", JSON.stringify(preRenderedProps)); // head script에 server 측 주입
```

```tsx
import { useRouter } from "../libs/Router";

const About = (props: any) => {
  const { push } = useRouter();

  return <div style={{ textAlign: "center" }}>// ...</div>;
};

export default About;

About.getServerSideProps = async (data: any) => {
  data.hi = "ssr data";
  return data;
};
```

이제 Next.js 코드 베이스에서 위 설명이 맞는지 확인할 차례다.

```ts
// https://github.dev/vercel/next.js/blob/e933e1d211ea16c349898e141d9733b4cd06e3d8/packages/next/server/load-components.ts#L123-L140
const ComponentMod = await Promise.resolve().then(() =>
  requirePage(pathname, distDir, serverless, isAppPath)
);

const [buildManifest, reactLoadableManifest, serverComponentManifest] =
  await Promise.all([
    require(join(distDir, BUILD_MANIFEST)),
    require(join(distDir, REACT_LOADABLE_MANIFEST)),
    hasServerComponents
      ? require(join(distDir, "server", FLIGHT_MANIFEST + ".json"))
      : null,
  ]);

const Component = interopDefault(ComponentMod);
const Document = interopDefault(DocumentMod);
const App = interopDefault(AppMod);

const { getServerSideProps, getStaticProps, getStaticPaths } = ComponentMod;
```

- `requirePage` 라는 함수에 요청이 들어온 경로를 넘겨주고 그 경로에 매칭되는 페이지 파일에서 컴포넌트를 가져온다.

- 리턴 값 중 서버 사이드 관련 메서드를 별도로 뽑아낸다.

```ts
// https://github.dev/vercel/next.js/blob/e933e1d211ea16c349898e141d9733b4cd06e3d8/packages/next/server/render.tsx#L959-L974
try {
  data = await getServerSideProps({
    req: req as IncomingMessage & {
      cookies: NextApiRequestCookies
    },
    res: resOrProxy,
    query,
    resolvedUrl: renderOpts.resolvedUrl as string,
    ...(pageIsDynamic ? { params: params as ParsedUrlQuery } : undefined),
    ...(previewData !== false
      ? { preview: true, previewData: previewData }
      : undefined),
    locales: renderOpts.locales,
    locale: renderOpts.locale,
    defaultLocale: renderOpts.defaultLocale,
  })
```

- 뽑아낸 메서드를 실행시켜 data 변수에 담은 뒤, 서버 측에서 React 컴포넌트 렌더링 시 props로 전달한다.

<br>

## 정리

굉장한 단어들로 포장이 되어 있지만 결국 서버 사이드 렌더링 관련 메서드라고 해봤자 그냥 페이지 컴포넌트 파일 내에 export로 내보낸 모듈 중 특수한 이름을 가진 함수들을 Next.js가 가져가서 대신 사용해줬을 뿐, 그 이상도 이하도 아니다.

여기서 `Next.js가 가져가서 대신 사용` 했다는 대목은 아주 중요하다. Next.js가 프레임워크라는 아주 확실한 증거이기 때문이다. 이제 아래 질문들에 자연스럽게 대답할 수 있으리라고 생각한다. 해당 함수를 Next.js가 가져가서 서버에서 실행한다는 컨셉만 이해하고 있다면 어렵지 않게 답할 수 있는 질문들이다.

- `getServerSideProps` 와 같은 메서드 안에서 `document` 등의 객체를 호출할 수 없는 이유는?
- `getServerSideProps` 와 같은 메서드를 페이지 컴포넌트 내에서만 호출할 수 있는 이유는?
- `getServerSideProps` 와 같은 메서드의 리턴값으로 직렬화 가능한 형태의 값만 넣어줘야 하는 이유는?
- …

다시 이 포스팅의 제목이었던 `Next.js의 SSR은 왜 페이지 단위로만 가능할까?`에 대한 대답은 `Next.js의 SSR 렌더링 단위와 라우터 구조가 서로 강결합 되어 있기 때문`이고(`const { getServerSideProps, getStaticProps, getStaticPaths } = ComponentMod`를 생각해보자), 이러한 이유로 `Pages Router` 구조를 그대로 유지하기 어려웠을 것이다.

이어, `Next.js가 페이지 단위로 SSR을 한다는 전제 자체가 잘못되었다`는 대답 또한 정답인 것은 Next.js 13 버전의 `App Router`와 `React Server Component`의 등장으로 서버 사이드 렌더링 단위가 페이지에서 컴포넌트 단위로 세분화 되었기 때문이다.

Next.js 13 버전과 RSC에 대한 공부를 최근에 못하고 있는데 좀만 더 여유를 찾고 다시 시도해봐야겠다.
