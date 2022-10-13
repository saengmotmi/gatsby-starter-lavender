---
title: 2021-12-10 react-query 시작부터 적용까지
date: 2021-12-10
description: "Why? 부터 Suspense 까지 한방에 뿌셔보자!"
tags: [React, Development]
thumbnail: /thumbnails/hello-world.jpg
---

# 0. Before Start

예전 부터 정리하고 싶었던 내용인데 우연한 기회로 실제 써보면서 터득한 부분이 있어서 정리해둔다.

결론부터 짚어두자면 `react-query`의 핵심은,

1. `Server State`라는 개념을 도입하며 프론트엔드에서 서버 데이터를 다루는 방식을 재정의했으며,

2. 그렇게 재정의 한 문제를 `stale-while-revalidate` 전략을 통해 효과적으로 해결하면서도,

3. `Custom Hook` + `Suspense` 등 React 생태계의 중요 API에 잘 어울리는 형태를 채택하며 DX(Development Experience) 측면에서도 좋은 점수를 받았다는 점에 있다.

너무 칭찬만 하는거 아닌가 싶긴 하지만 복잡한 비동기 처리를 어떻게 이렇게 간결하고 직관적인 API를 사용하면서도 러닝커브가 낮은 방식으로 해결했는지 놀라울 따름이다.

<br>

# 1. Server State?

상태 관리는 어렵다. 전역 상태 관리 역시 어렵다. 하지만 전역 상태 관리가 어려운 것인지, 전역 상태 관리에 사용되는 redux와 친구들이 어려운 것인가에 대해서는 많은 갑론을박이 있어 왔다.

오늘의 주인공 react-query는 이 문제를 다소 다른 각도에서 접근한다. 언어는 사고를 규정한다. global state를 어떻게 관리할 것인가를 놓고 싸우는 것이 아니라, 문제의 틀이 `global state` 인 것 자체가 틀렸다는 것이다. 우리는 이를 좀 더 세부적으로 나누어 `Client State(UI State)` 와 `Server State`로 나누어 접근해 볼 수 있다.

<br>

**1) UI State**

> State that's only useful in the UI for controlling the interactive parts of our app (like modal isOpen state).

- Non-Persist
- Synchronous
- Client-Owned
- Reliably Up-To-Date

<br>

**2) Server Cache**

> State that's actually stored on the server and we store in the client for quick-access (like user data).

- Remotely Persisted
- Asynchronous
- Shared Ownership
- Potentially Out-Of-Date

두 State의 가장 핵심적인 차이는 클라이언트 입장에서 자기 자신이 유일한 정보의 원천(Single Source of Truth)가 될 수 있는지 여부다. 모든 문제는 이 근본적인 차이에서 파생된다.

예시를 통해 설명해보자.

<br>

**:: global state**

```jsx
const globalState = {
  projects,
  teams,
  tasks,
  users,
  themeMode,
  sidebarStatus,
};
```

**:: global state without server state**

```jsx
const globalState = {
  themeMode,
  sidebarStatus,
};
```

Modal 창이나 다크모드의 on/off 여부는 클라이언트에서 온전히 소유하고 동기적으로 다룰 수 있다. 자명한 사실이다. UI 요소들에 대한 전역 상태는 대부분 유사하다.

반면 DB에 저장된 데이터를 가져올 때는 이야기가 달라진다. 클라이언트는 DB에서 무슨 일이 일어나는지 요청을 보내보지 않고는 알 수 있는 방법이 없다. outdated 된 정보, loading/error status와 같은 비동기 문제는 이처럼 클라이언트에서 온전히 알 수 없는 정보들을 처리할 때 발생한다.

우리는 이 두 가지 문제들을 뒤섞어 처리하며 많은 혼란을 느껴왔다고도 볼 수 있다.

물론 Redux와 친구들이 달고 다니던 어마어마한 규모의 보일러플레이트 또한 그 혼란을 가중시켰음은 물론이다.

일반적으로 서버에서 가져온 비동기 데이터를 관리하기 위해 `redux`, `react-redux`와 그것의 미들웨어 라이브러리인 `redux-saga`, 그리고 보일러 플레이트를 줄이기 위해 `redux-tookit` 조합을 활용한다.

각 라이브러리의 고유한 사용법, 특히 redux-saga의 경우 제너레이터 문법과 `take`, `put`과 같은 전용 헬퍼 함수들의 사용법을 익히기 위한 러닝 커브가 상당하다는 지적은 꾸준히 제기되어 왔다.

하지만 문제는 비단 러닝 커브에서만 그치지 않는다.

전역 상태 관리 라이브러리로 Server State를 관리하는 것은 크게 다음과 같은 두 가지의 구조적 문제점을 가지고 있다.

<br>

**1) 필요로 하는 값은 redux에 존재한다는 가정**

- 만약 원하는 값이 있도록 하는 Action이 발생하지 않을 경우,

- 언제나 필요한 값이 있다고 완전히 보장하기 어려워 런타임에서 에러가 발생할 수 있음

**2) 특정 시점에 capture된 데이터가 outdated 되지 않음**

- 접근하고자 하는 데이터가 outdated 된 cache일 가능성은 언제나 존재함

- 동일한 데이터를 client store와 server 두 곳에서 다루고 있어 single source of truth 원칙을 위배함

<br>

무엇보다도 server cache에 대한 복잡한 비동기 처리(`error`, `loading`, `success`)가 불필요 해지면 `redux-saga` 위에서 설명한 미들웨어 라이브러리를 쓸 당위성도 줄어든다. 오직 UI State만을 가볍게 전역으로 관리한다면 반드시 `redux` 만이 해답이 아닐 수도 있게 되는 것이다.

<br>

# 2. Use Cache For Server State

그러한 관점에서 Server State를 전문적으로 처리하고자 새롭게 등장한 접근 방식이 `react-query` , `swr` 등의 라이브러리다.

> Hooks for fetching, caching and updating asynchronous data in React (`react-query`)

> SWR is a strategy to first return the data from cache (stale), then send the fetch request (revalidate), and finally come with the up-to-date data. (`SWR`)

</aside>

이러한 라이브러리들은 서버로부터 가져온 정보를 캐시처럼 관리한다. 그리고 이 정보들의 유통기한이 지나 상하면(`stale`) 서버에 다시 요청을 보내 신선한 정보로 기존 데이터를 업데이트 한다.

이는 HTTP Header의 stale-while-revalidate 로직의 컨셉을 차용한 것이라고 한다. 아래 도식을 보면 어느 정도 컨셉이 와닿을 것이라고 생각된다.

![stale-while-revalidate](https://s3.us-west-2.amazonaws.com/secure.notion-static.com/03e88ef2-b33e-4c72-b09b-04e3283a65a0/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20220124%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20220124T191234Z&X-Amz-Expires=86400&X-Amz-Signature=2397787e71f900f7d0608b0324fdb5aaa15b23779d0174502376b82540af33ed&X-Amz-SignedHeaders=host&response-content-disposition=filename%20%3D%22Untitled.png%22&x-id=GetObject)

각설하고 `react-query` 를 사용하여 데이터를 fetching 하는 공식 문서의 예제 코드를 살펴보자. 정말 너무 간단해서 크게 부가설명 할 것도 없다. Apollo Client for React를 써봤다면 더더욱 익숙한 API 일 것이다.

아래 코드가 전부이고, 하이라이트 처리한 부분만 조금 눈여겨 보면 될 것 같다.

```jsx
import { QueryClient, QueryClientProvider, useQuery } from "react-query";

const queryClient = new QueryClient(); // #1 - Cache

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  );
}

function Example() {
  const { isLoading, error, data } = useQuery("repoData", () =>
    // #2 - Cache Key & Fetcher
    fetch("https://api.github.com/repos/tannerlinsley/react-query").then(
      (res) => res.json()
    )
  );

  if (isLoading) return "Loading...";

  if (error) return "An error has occurred: " + error.message;

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
      <strong>👀 {data.subscribers_count}</strong>
      <strong>✨ {data.stargazers_count}</strong>
      <strong>🍴 {data.forks_count}</strong>
    </div>
  );
}
```

1. 앱 전역에서 Server State의 결과와 stale 상태 등을 저장하기 위한 캐시. #2의 요청은 바로 이 인스턴스 내부에 저장된다.

2. useQuery Hook을 사용하여 비동기 GET 요청. 첫 번째 인자로는 해당 요청의 Cache Key를 설정하고, 두 번째 인자로는 useQuery가 수행할 비동기 요청을 함수로 정의해주면 된다.

<br>

# 3. Examples

실제 사용 예시를 통해 어떤 식으로 요청을 관리하면 좋을지에 대해 살펴보자.

소개할 예시 코드는 TodoList다. 여기서 핵심은 역할에 따른 파일의 분리이고, 동시에 Co-Location이다.

React Query의 메인테이너인 TkDodo는 Kent C. Dodds까지 인용해가며 [다음과 같이 쿼리를 컴포넌트 옆에 관리하자고 제안](https://tkdodo.eu/blog/effective-react-query-keys#colocate)했다. 나는 꼭 이 글을 읽어서라기 보다 GraphQL을 쓰다 보니 얻어진 패턴이었는데 React Query에도 적용되는 Best Practice 였던 것 같다.

```
- src
  - features
    - Profile
      - index.tsx
      - queries.ts
    - Todos
      - index.tsx
      - queries.ts
```

다시 코드로 넘어오자.

데이터를 호출하는 로직은 커스텀 훅으로 분리하였으며 해당 커스텀 훅의 경로는 colocation 차원에서 컴포넌트 파일과 같은 depth의 api 폴더에 위치해 있다. 그리고 다시 api 폴더에는 RESTful API 기준 자원 기준으로 분리된 파일들에 커스텀 훅이 분리되어 있다.

```tsx
interface TodoListContainerProps {
  selectedTodos: SelectedTodos;
  handleSelectedTodos: (id: string) => void;
}

const TodoListContainer: React.FC<TodoListContainerProps> = ({
  selectedTodos,
  handleSelectedTodos,
}) => {
  const { data: todos } = useGetTodos();

  return (
    <>
      {todos?.length === 0 ? (
        <EmptyContent text="등록된 할 일이 없습니다" />
      ) : (
        sortByNewest(memos!).map((todo) => (
          <TodoListItem
            key={todo.id}
            {...todo}
            selectedTodos={selectedTodos}
            handleSelectedTodos={handleSelectedTodos}
          />
        ))
      )}
    </>
  );
};

export default TodoListContainer;
```

- `useGetTodos` 커스텀 훅은 데이터 fetching에 대한 모든 세부 사항들을 처리하고 완료된 데이터만 컴포넌트로 전달해준다.

```tsx
import api from "libs/api";
import { useQueryParams } from "utils/hooks";
import type { Memo } from "models";
import { labelCache, memoCache } from "models";

export const useGetTodos = () => {
  const { labelId } = useQueryParams();

  const getTodosByLabel = async () => {
    return (await api.get<AxiosResponse<Todo[]>>(`/labels/${labelId}/todos`))
      .data.data;
  };
  const getTodosAll = async () => {
    return (await api.get<AxiosResponse<Todo[]>>("/todos")).data.data;
  };

  return labelId
    ? useQuery(todoCache.getTodoByLabel(labelId), getTodosByLabel)
    : useQuery(todoCache.getTodosAll, getTodosAll);
};
```

- `useGetTodos`는 현재 페이지의 path parameter를 읽어 전체 목록과 상세 목록을 달리 요청하도록 되어 있다.

- 커스텀 훅의 리턴 값이 useQuery의 리턴 값이므로 커스텀 훅 역시 자연스럽게 `{ data, isLoading, error, ... }` 와 같은 리턴 값의 형태를 갖게 된다.

- 첫 번째 인자로 주어야 하는 Cache Key는 일관된 관리를 위해 `todoCache` 라는 객체를 model에 만들고 일관되게 관리 될 수 있도록 했다. 이 값은 추후 캐시 무효화를 위해 사용되어야 하는 매우 중요한 값이다.

- fetcher인 `getTodosByLabel` 과 `getTodosAll` 의 경우 `useGetTodos` 에 종속되는 형태로 사용되므로 내부 함수로 선언해 사용했다.

```tsx
// Memo
export interface Todo {
  title: string;
  content: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export const todoCache = {
  getMemosAll: "getMemo",
  getMemo: (memoId: string) => "getMemo" + memoId,
  getMemoByLabel: (labelId: string) => "getMemoByLabel" + labelId,
};
```

- interface와 함께 cache key를 함께 관리하고 있다. 다시 TkDodo는 캐시 키를 글로벌 하게 관리하지 말자고 했지만, 일단 나는 이 부분만큼은 글로벌하게 관리하는게 어떨까 싶어서 위와 같이 작성해보았다. 추후 앱이 굉장히 복잡해지게 되면 문제가 될 수도 있을 것 같긴 한데, 아직은 내가 무효화 하고자 하는 쿼리를 찾기 힘든 문제를 겪는게 더 가깝게 느껴졌다.

- 그런데 좀 더 읽어보니 [항상 배열 형태의 키를 사용하는게 좋다](https://tkdodo.eu/blog/effective-react-query-keys#always-use-array-keys)고 하니, 다음부터는 해당 조언을 따라보고자 한다. 참고로 배열 내의 값이 업데이트 되면 react-query는 해당 fetcher를 다시 호출한다.

```tsx
export const useDeleteTodos = () => {
  const client = useQueryClient();

  const deleteTodos = async (todoId: string) => {
    return api.delete(`/todos/${todoId}`);
  };

  return useMutation(deleteTodos, {
    onSuccess: (data, variables, context) => {
      client.invalidateQueries(todoCache.getTodosAll);
      client.invalidateQueries(labelCache.getLabelsAll);
    },
    onError: (error) => {
      alert("할 일을 삭제하던 도중 문제가 발생하였습니다");
      console.error(error);
    },
  });
};
```

- 위의 코드는 할 일을 삭제한 후 삭제된 목록을 다시 업데이트 해야 할 때 cache를 무효화 시키는 역할을 한다. `useMutation`의 `onSuccess` 에 넘겨준 콜백은 mutation이 성공하고 난 뒤에 실행된다. `client.invalidateQueries(todoCache.getTodosAll)` 부분만 살펴보면 되겠다. 위에서 설명했듯 무효화 된 쿼리는 새로운 데이터를 반영하기 위해 자동적으로 refetch 된다.

- 캐시를 사용하는 만큼 Optimistic update를 하는게 어떨까 싶긴 하지만 react query 측은 대부분의 경우 [Optimistic update는 문제를 더 복잡하게 만들 뿐](https://tkdodo.eu/blog/mastering-mutations-in-react-query#optimistic-updates)이라는 입장인 것 같다.

<br>

# 4. Suspense with React Query

그런데 여기서 하나 빠진 퍼즐 조각이 있다. 공식 문서의 예제 코드와 TodoList 예제 코드를 비교해보면 후자의 경우 data만 처리할 뿐 Loading status 등에 대해 별도로 대응하고 있지 않다.

분명 비동기 처리 어려워서 여기까지 왔던 것 같은데 정작 그 내용이 없다니 싶을 수 있다. 하지만 이 부분은 좀 더 우아하게 처리 위해 잠시 추진력을 모은 것 뿐.

다음 코드를 보자. React에서 제공하는 Suspense 컴포넌트를 사용한 예제다.

```tsx
import { Suspense } from "react";

<Suspense fallback={<Loading />}>
  <Todos />
</Suspense>;
```

내가 렌더링 하고자 하는 컴포넌트는 `Todos` 다. 이를 `Suspense` 컴포넌트가 children으로 받고 있는 형태다. 만약 Todos에서 비동기 처리가 일어나고 있으면(loading), 그 동안 fallback에 넘겨준 값을 출력하고 있도록 한다. 비동기 처리가 끝나면 원래 콘텐츠인 Todos를 보여준다.

물론 마법처럼 되는 것은 아니고, 마치 에러 메시지가 상위 컨텍스트로 전파되듯, 상위 컴포넌트로 Promise를 throw 하여 컴포넌트가 로딩 상태임을 전파시켜야 한다. try-catch의 catch가 에러 상태를 받아 처리해주듯이 Suspense는 비동기 상태를 대신 처리해주는 것이다.

아래 코드는 Suspense의 창안자인 Sebastian Markbåge가 설명을 위해 작성한 예제다. 김맥스님의 주석이 달려 있다.

핵심은 `throw`다. 무한 루프를 돌면서 던져지는(throw) 것들을 감지하고, 그 중 Promise의 인스턴스가 있을 경우 await 하여 promise에 대해 resolve 시도하고 다른 컴포넌트를 먼저 렌더링한다. 아마 이 과정에서 렌더링이 블로킹 되지 않도록 Fiber 기반의 Concurrent Mode가 개입하는 건가 싶은데 맞는지는 잘 모르겠다. 최종적으로 try가 잘 끝나게 되면 runPureTask는 리턴된다.

```tsx
let cache = new Map();
let pending = new Map();

function fetchTextSync(url) {
  // fetcher
  if (cache.has(url)) {
    return cache.get(url); // 캐시 맵객체
  }
  if (pending.has(url)) {
    throw pending.get(url); // Pending Promise throw
  }
  // 비동기 로직
  let promise = fetch(url)
    .then((response) => response.text()) // 처리되는 경우
    .then((text) => {
      pending.delete(url);
      cache.set(url, text);
    });
  pending.set(url, promise); // 팬딩 객체에 팬딩인거 표시
  throw promise;
}

async function runPureTask(task) {
  for (;;) {
    // while true
    //!!! 태스크를 리턴할 수 있을 때까지 바쁜대기를 함(무한루프) !!!
    try {
      return task(); // 태스크 값을 리턴할 수 있게 되면 무한루프에서 벗어난다
    } catch (x) {
      // throw를 거른다
      if (x instanceof Promise) {
        await x; // pending promise가 throw된 경우 await으로 resolve 시도 => suspense
      } else {
        throw x; // Error가 throw된 경우 그대로 error throw => ErrorBoundary, 종료
      }
    }
  }
}
```

이러한 컨셉을 react-query와 결합할 수 있다. 아래와 같이 옵션에 `suspense: true`를 주면 모든 쿼리 요청의 로딩 상태가 상위 컴포넌트로 전파되어 별도의 로딩 처리를 해줄 필요가 없어진다. 그리고 이를 Suspense 컴포넌트로 처리해주면 된다. 로딩 상태와 연관된 정말 많은 코드를 생략할 수 있게 되는 것이다.

```tsx
const client = new QueryClient({
  defaultOptions: { queries: { suspense: true } },
});
```

에러 처리도 class형 컴포넌트의 componentDidCatch 등을 사용하여 컴포넌트가 전파되는 에러를 잡도록 만들어주면 된다. 얼마나 아름다운지!

참고로 Next.js의 SSR에서는 아직 Suspense를 지원하지 않아 에러가 발생하기 때문에 CSR 타이밍에서만 Suspense가 동작하도록 해주자. 다음과 같이 하면 된다.

```tsx
import { useState, useEffect, Suspense } from "react";
import { useMounted } from "utils/hooks";

export default function SSRSafeSuspense(
  props: React.ComponentProps<typeof Suspense>
) {
  const isMounted = useMounted();

  if (isMounted) {
    return <Suspense {...props} />;
  }
  return <>{props.fallback}</>;
}

export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
```

<br>

# 5. Etc

여담으로 react-query는 일종의 개발자 도구를 지원한다. 내가 보냈던 비동기 요청들이 캐시 안에 어떻게 저장되어 있는지 확인해볼 수 있다. `<QueryClientProvider />` 바로 자식 요소 자리에 `<ReactQueryDevtools />` 를 세팅해주면 된다.

백번 말로 하는 것 보다 이리저리 눌러보며 직접 한번 살펴보자.

[https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/star-wars?from-embed=&file=/src/App.js](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/star-wars?from-embed=&file=/src/App.js)

# Reference

- [React Query Docs](https://react-query.tanstack.com/)

- [Practical React Query, TkDodo](https://tkdodo.eu/blog/practical-react-query) (React Query Maintainer)

- [전역 상태 관리에 대한 단상 (stale-while-revalidate), jbee](https://jbee.io/react/thinking-about-global-state/)

- [React-Query 살펴보기, 김맥스](https://maxkim-j.github.io/posts/react-query-preview)

- [Suspense for Data Fetching의 작동 원리와 컨셉 (feat.대수적 효과), 김맥스](https://maxkim-j.github.io/posts/suspense-argibraic-effect)

- [프론트엔드 웹 서비스에서 우아하게 비동기 처리하기 (SLASH 21 발표), 박서진](https://www.youtube.com/watch?v=FvRtoViujGg)
