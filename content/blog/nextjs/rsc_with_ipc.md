---
title: 2023-06-13 Next.js 13의 서버는 두 개란다
date: 2023-06-13
description: IPC라고 있는데... 처음 들어보시나요?
tags: [React, Nextjs, Development]
thumbnail: /thumbnails/hello-world.jpg
---

## Next.js 13의 서버는 두 개란다

사실 처음에 이 이슈로 파고들게 된 경위는 최근 새롭게 발표된 Server Actions 가 내부적으로 도대체 어떻게 동작하는건지 감도 안잡혀서 관련한 구현을 찾아보려고 했던 게 시작이었다. 하지만 Next.js는 React와 다르게 RFC로 미리 공개하고 작업하기 보다는 내부에서 뚝딱 뚝딱 만들어서 갑자기 짠! 하거나 트위터에서 관련 개발자들이 주절대는 내용으로 흘러나오는 것들이 대부분인 듯 했고 진척은 지지부진 했다.

그렇게 뒤적거리다 https://github.com/vercel/next.js/blob/canary/packages/next/src/server/lib/server-ipc/index.ts 이 코드를 발견하게 되었고 나는 조금 당혹스러워졌다. 왜냐하면 원래 Next.js는 내부적으로 `http` 모듈을 기반으로 띄운 단일 Node.js 서버에서 요청을 받고, HTML을 그려 응답을 내보내 주는 형태의 구현이었는데, 이 코드를 보니 이전에 보지 못했던 `createIpcServer()` 라는 함수와 `createWorker()`라는 함수로 부터 적어도 하나 이상의 서버가 존재함을 알 수 있었기 때문이다.

최초 구현은 https://github.com/vercel/next.js/pull/47208 여기서 되었고, pages 라우트와 app 라우트를 분리하는 작업이 이루어졌다. 핵심 코드는 다음과 같다.

```ts
// packages/next/src/server/next-server.ts (constructor)
const { createWorker, createIpcServer } =
  require('./lib/server-ipc') as typeof import('./lib/server-ipc')
this.renderWorkersPromises = new Promise<void>(async (resolveWorkers) => {
  try {
    this.renderWorkers = {}
    const { ipcPort } = await createIpcServer(this)
    if (this.hasAppDir) {
      this.renderWorkers.app = createWorker(
        this.port || 0,
        ipcPort,
        options.isNodeDebugging,
        'app'
      )
    }
    this.renderWorkers.pages = createWorker(
      this.port || 0,
      ipcPort,
      options.isNodeDebugging,
      'pages'
    )
    this.renderWorkers.middleware =
      this.renderWorkers.pages || this.renderWorkers.app

    resolveWorkers()
    // 생략
```

IPC(Inter-Process Communication)는 여기서 처음 접한 개념인데, 약어를 풀어보았을 때 볼 수 있듯 프로세스 간 통신을 중개하는 방식의 하나이다. 이전에는 단일 프로세스에서 요청을 받고 응답을 내보내는 방식이었다면, 이제는 IPC 서버를 중심으로 개별 Worker에서 목적에 맞는 작업을 수행하면서, 필요할 경우 IPC 서버를 통해 다른 Worker에 요청을 보내는 방식으로 동작하게 된다.

다시 `/server-ipc/index.ts`를 들여다보면 Node.js의 API를 직접 사용하여 Worker를 생성하지 않고 `jest-worker`를 사용한 것이 인상적이다. https://github.com/jestjs/jest/tree/main/packages/jest-worker 여기서 읽어봐도 딱히 특별한 점은 잘 모르겠지만 아무튼 Worker를 생성하고 관리하는 차원에서 이런저런 편의 기능을 제공하나보다.

```ts
export const createWorker = async (
  ipcPort: number,
  ipcValidationKey: string,
  isNodeDebugging: boolean | 'brk' | undefined,
  type: 'pages' | 'app',
  useServerActions?: boolean
) => {
  const { initialEnv } = require('@next/env') as typeof import('@next/env')
  const { Worker } = require('next/dist/compiled/jest-worker')
```

미리 궁예를 좀 해보자면 아마 기존에 하던 SSR은 그대로 떠서 Worker 하나에 맡기고, 새로 추가된 Server Actions 정도를 추가 Worker에 할당해서 요청이 필요할 때 상호소통 하도록 하는건가 싶었다. 하지만 관련 자료가 없어 확신을 얻지 못하던 와중에...

<br>

## RSC from Scratch

Dan Abramov가 RSC(React Server Components) 개념을 좀 더 쉽게 커뮤니티에 보급하기 위해 RSC from Scratch라는 이름의 자료를 만들어 주었는데 그 중에 관련 내용을 발견할 수 있었다. 여담이지만 RSC를 바닥부터 만들어보는 강의 자료이고 시중에 이것보다 정확하고 명료한 자료가 없으므로 관심이 있다면 꼭 한번 보는 걸 추천드린다.

- https://github.com/reactwg/server-components/discussions/5 (원문)

- https://codesandbox.io/p/sandbox/agitated-swartz-4hs4v1?file=%2Fserver%2Fssr.js (코드 샌드박스)

- https://velog.io/@glassfrog8256/%EB%B2%88%EC%97%AD-RSC-From-Scratch.-Part-1-Server-Components (한국어 번역)

> 이전 단계에서, 실행 중인 컴포넌트가 HTML을 생성하지 않도록 분리했습니다.
>
> - 먼저 renderJSXToClientJSX 는 컴포넌트들이 클라이언트 JSX를 생성하도록 합니다.
>
> - 이후에, 리액트의 renderToString 이 클라이언트 JSX를 HTML로 변경합니다.
>
> 서로 독립적인 동작이기 때문에, 이들을 같은 절차, 혹은 같은 기계에서 완료 될 필요가 없습니다.
>
> 이를 증명하기 위해, server.js 를 2개의 파일로 나눕시다.
>
> - `server/rsc.js` : 이 서버는 우리의 컴포넌트들을 실행시킵니다. 항상 JSX를 리턴하며 HTML을 리턴하지 않습니다. 만약 컴포넌트들이 데이터베이스에 접근한다면, 지연시간 감소를 위해 서버를 데이터 센터와 가까운데서 실행하는게 좋습니다.
>
> - `server/ssr.js` : 이 서버는 HTML을 만들어 냅니다. HTML을 만들고, 정적 파일들을 제공하기 위해 "edge" 에서 실행 시킬 수 있습니다.

이러한 설명에 이어 아래와 같은 예시 코드(위에 링크 걸어둔 코드 샌드박스를 들어가보면 보다 상세한 코드를 볼 수 있다)를 보여준다.

보시다시피 SSR을 하면서 RSC를 렌더링 하는 별도의 서버에 요청을 보내고, 그 결과를 받아서 HTML로 최종 렌더링 하는 방식이다.

```ts
// server/ssr.js
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === "/client.js") {
      // ...
    }
    // Get the serialized JSX response from the RSC server
    const response = await fetch("http://127.0.0.1:8081" + url.pathname);
    if (!response.ok) {
      res.statusCode = response.status;
      res.end();
      return;
    }
    const clientJSXString = await response.text();
    if (url.searchParams.has("jsx")) {
      // If the user is navigating between pages, send that serialized JSX as is
      res.setHeader("Content-Type", "application/json");
      res.end(clientJSXString);
    } else {
      // If this is an initial page load, revive the tree and turn it into HTML
      const clientJSX = JSON.parse(clientJSXString, parseJSX);
      let html = renderToString(clientJSX);
      html += `<script>window.__INITIAL_CLIENT_JSX_STRING__ = `;
      html += JSON.stringify(clientJSXString).replace(/</g, "\\u003c");
      html += `</script>`;
      // ...
      res.setHeader("Content-Type", "text/html");
      res.end(html);
    }
  } catch (err) {
    // ...
  }
}).listen(8080);
```

즉, SSR 서버는 외부 세계의 유저로부터 요청을 받는 한편 RSC 서버는 RSC 렌더링만을 수행하는 내부 서버인 셈이다. 우리가 지금 확인한 코드는 RSC에 대한 내용이지만 대략 이런 방식으로 Server Actions를 처리하는 것이 아닐까 생각이 들었다.

그런데 그냥 별도의 IPC 서버(`fetch`로 통신)로 안 만들고 부모 프로세스에서 처리해도 되지 않나 싶기도 해서 좀 더 생각을 해봤다.

애초에 글 서두 처음으로 인용했던 코드 블록이 `/next-server.ts` 에서 `NextNodeServer`를 초기화 할 때 `constructor` 함수에서 IPC 서버와 워커들을 등록하는 부분이다. `createIpcServer` 쪽 상단에 적혀 있는 주석을 다시 잘 읽어보면 아래와 같이 해석할 수 있다.

```ts
// we can't use process.send as jest-worker relies on
// it already and can cause unexpected message errors
// so we create an IPC server for communicating
export const createWorker = async (
```

> 우리는 process.send를 사용할 수 없다. 왜냐하면 jest-worker가 이미 이를 사용하고 있기 때문이며, 이로 인해 예상치 못한 메시지 오류가 발생할 수 있다. 그래서 우리는 통신을 위한 IPC (Inter-Process Communication) 서버를 생성한다.

여기서부터는 약간 배경지식이 필요해서 잠시 우회가 필요하다.

`process.send`는 Node.js에서 제공하는 메서드로, 주로 부모 프로세스와 자식 프로세스 사이에서 메시지를 주고받는데 사용된다. 이 메서드는 Node.js의 `child_process` 모듈의 `child_process.fork` 메서드를 사용해 생성된 자식 프로세스에서만 사용 가능하다.

예를 들어, 자식 프로세스에서 다음과 같이 메시지를 보낼 수 있다.

```ts
process.send({ foo: "bar" });
```

이 메시지를 수신하기 위해 부모 프로세스에서는 'message' 이벤트 리스너를 설정할 수 있다.

```ts
child.on("message", (msg) => {
  console.log("Received message:", msg);
});
```

이런 방식으로 프로세스 간 통신(IPC)가 가능해지고, 앞서 언급한 병렬 처리나, 무거운 작업을 분리된 프로세스에서 처리하는 등의 경우에 유용하게 사용될 수 있게 되는 것이다.

그런데 `jest-worker` 라이브러리는 Node.js의 `process.send` 메서드를 이미 내부적으로 사용한다. jest-worker 또한 이를 이용해서 워커들과 통신을 구현(`reportSuccess` 등)하고 있다. 그래서 직접 `process.send`를 사용하면 `child.on()` 쪽에서 메시지가 뒤섞여 의도치 않은 동작이 일어날 수 있기 때문에 이런 문제를 피하기 위해 별도의 IPC 서버를 만들어서 jest-worker가 사용하는 process.send와 독립적으로 통신하도록 하는 것으로 보는 것이 맞아 보인다.

아무튼 이차저차 해서 워커를 등록한 뒤 아래 코드와 같이 앞에서 세팅된 `renderWorkersPromises`를 일단 먼저 해소하고 값을 비운 뒤(일단), renderKind(`app` or `pages`) 플래그로 분기를 태워 적당한 Worker를 호출한다.

App Router의 경우에는 `renderWorkersPromises`가 최초 해소되는 지점에서 RSC를 일단 렌더링 하고 스트리밍으로 추가 렌더링 요소들을 넘겨주지 않으려나 싶다.

```ts
// packages/next/src/server/next-server.ts (generateRoutes)
// 생략...
  if (this.renderWorkersPromises) {
    await this.renderWorkersPromises
    this.renderWorkersPromises = undefined
  }
  const renderWorker = this.renderWorkers?.[renderKind]

  if (renderWorker) {
    const initUrl = getRequestMeta(req, '__NEXT_INIT_URL')!
    const { port, hostname } = await renderWorker.initialize(
      this.renderWorkerOpts!
    )
    const renderUrl = new URL(initUrl)
    renderUrl.hostname = hostname
    renderUrl.port = port + ''

    let invokePathname = pathname
    const normalizedInvokePathname =
      this.localeNormalizer?.normalize(pathname)

    // 생략...
    const invokeRes = await invokeRequest(
      renderUrl.toString(),
      {
        headers: invokeHeaders,
        method: req.method,
      },
      getRequestMeta(req, '__NEXT_CLONABLE_BODY')?.cloneBodyStream()
    )
    // 생략...
    res.statusCode = invokeRes.statusCode
    res.statusMessage = invokeRes.statusMessage

    for await (const chunk of invokeRes) {
      this.streamResponseChunk(res as NodeNextResponse, chunk)
    }
    ;(res as NodeNextResponse).originalResponse.end()
    return {
      finished: true,
    }
  }
}
```

가장 중요한 `invokeRequest` 함수는 아래와 같이 정의되어 있다. Node.js http 모듈의 `request` 메서드를 사용해 데이터를 전송한다.

```ts
// packages/next/src/server/lib/server-ipc/invoke-request.ts
import { IncomingMessage } from "http";
import { filterReqHeaders } from "./utils";

export const invokeRequest = async (
  targetUrl: string,
  requestInit: {
    headers: IncomingMessage["headers"];
    method: IncomingMessage["method"];
  },
  readableBody?: import("stream").Readable
) => {
  const invokeHeaders = filterReqHeaders({
    ...requestInit.headers,
  }) as IncomingMessage["headers"];

  const invokeRes = await new Promise<IncomingMessage>(
    (resolveInvoke, rejectInvoke) => {
      const http = require("http") as typeof import("http");

      try {
        const invokeReq = http.request(
          targetUrl,
          {
            headers: invokeHeaders,
            method: requestInit.method,
          },
          (res) => {
            resolveInvoke(res);
          }
        );
        invokeReq.on("error", (err) => {
          rejectInvoke(err);
        });

        if (requestInit.method !== "GET" && requestInit.method !== "HEAD") {
          if (readableBody) {
            readableBody.pipe(invokeReq);
            readableBody.on("close", () => {
              invokeReq.end();
            });
          }
        } else {
          invokeReq.end();
        }
      } catch (err) {
        rejectInvoke(err);
      }
    }
  );

  return invokeRes;
};
```

추가로 `this.streamResponseChunk`는 이렇게 생겼다.

```ts
class NextNodeServer extends BaseServer {
  protected streamResponseChunk(res: NodeNextResponse, chunk: any) {
    res.originalResponse.write(chunk);
    // 생략...
  }
}
```
