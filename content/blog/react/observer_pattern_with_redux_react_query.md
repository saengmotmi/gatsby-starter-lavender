---
title: 2023-05-23 아름다운 것 (Redux에서 React Query 까지)
date: 2023-05-23
description: 옵저버 패턴(Observer Pattern)은 한 객체의 상태가 바뀌면 그 객체에 의존하는 다른 객체에게 연락이 가고 자동으로 내용이 갱신되는 방식으로 일대다(one-to-many) 의존성을 정의합니다.
tags: [React, Development]
thumbnail: /thumbnails/hello-world.jpg
---

### 1. 고도로 발전한 과학은 마법과 구분할 수 없다 - 아서 C. 클라크

요즘은 `redux` 잘 안쓰지만 2021년 즈음 까지만 해도 시장의 부정할 수 없는 대세였고, 여전히 많은 프로젝트에서 선택 받고 있는 라이브러리이다. 사실 그렇게까지 딥하게 써본 적은 없지만 `redux-thunk`나 `redux-saga`를 가지고 앱 전체의 api call을 컨트롤 하는 코드들을 보면 그만 정신이 아득해지는 걸 참을 수가 없었다. `SWR` 류 라이브러리를 사용할 수 있는 시대에 태어나서 진심으로 감사한 마음이 든다.

아무튼 redux가 대세였던 시절에 개발 공부를 시작한 사람들은 반드시 거쳐가야 했던 라이브러리였다고 생각한다. 물론 지금 개발 공부를 시작하더라도 `flux` 패턴 정도는 근본력을 위해서라도 한번 찍어먹어보고 가야하는 개념이기도 하거니와, 지금도 개발팀의 철학에 따라 신규 프로젝트에도 적극 사용하는 곳이 많을 거라고 생각한다.

잠시 이야기를 곁가지로 새보자면 나는 redux는 `Context API`의 상휘 호환 어디쯤에 있는 기술인 줄로만 알았다. `redux vs Context API`를 누군가 물어봤을 때 난 “Context 그거 그냥 후진거 아니냐”고 대답하기도 했다.

실은 redux는 react로부터 독립적인 자바스크립트 라이브러리 이고, `react-redux`를 통해 react의 렌더링 사이클을 전역 스토어의 업데이트와 연동시킬 수 있는 것이었으며 그 내부는 Context API로 만들어져 있다는 사실을 그땐 몰랐다… 사실 지금 생각해보면 컴포넌트 구조를 건너뛴다는 것 자체가 Context API를 사용하지 않고서는 불가능한 일인데 나는 그게 다 redux라는 마법의 우월함인 줄만 알았다.

하지만 내가 처음 열어본 github 레포지토리였던 redux-thunk를 시작으로 마법은 사실 고도로 발전한 과학 기술임을 깨닫기 시작했다.

아래는 진짜 순수한 implementation 그 자체 시절의 `thunk`다. 이 짧은 코드가 어떻게 비동기를 구현하는지 도저히 알 수 없었다. thunk가 컴퓨터 과학에서 “지연 계산”을 구현하는 일반적인 테크닉인 것 또한 몰랐다. 지연 계산임을 염두에 두고 코드를 들여다 보면 다시 보이는 지점이 있을 것이다.

```tsx
export default function thunkMiddleware({ dispatch, getState }) {
  return (next) => (action) =>
    typeof action === "function" ? action(dispatch, getState) : next(action);
}
```

어느날은 redux의 `createStore` 함수의 구현에 대해 설명해 둔 아티클을 읽게 되었다. 대략 아래와 같은 코드로 설명하고 있었다.

```tsx
const createStoreFromScratch = (reducer) => {
  let state;
  let listeners = [];

  const getState = () => state;

  const subscribe = (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  };

  const dispatch = (action) => {
    state = reducer(state, action);
    listeners.forEach((listener) => listener());
  };

  dispatch({});

  return { getState, subscribe, dispatch }; // store
};
```

이 코드에는 면접 공부를 하며 그렇게 줄줄 외우고 다녔던 클로저가 있었고, Observable 방식으로 업데이트에 반응하는 줄 알았지만(?) `subscribe`를 할 때마다 `listeners` 배열에 함수를 넣어두고 `dispatch` 함수를 호출할 때마다 전체를 냅다 한번씩 돌리는 방식으로 갱신에 대한 반응을 하고 있었으며, `unsubscribe`는 그냥 listeners 배열에서 구독 해제할 listener를 filter로 제거할 뿐이라는 놀라운 사실을 담고 있었다. 생각보다 어렵지 않았다.

createStore의 원본 코드는 [https://github.com/reduxjs/redux/blob/master/src/createStore.ts](https://github.com/reduxjs/redux/blob/master/src/createStore.ts) 여기에서 찾을 수 있다. 주석과 이런저런 불필요한 코드를 걷어내고 핵심 로직만 본다면 200여줄 정도로 그렇게 어렵지 않게 읽을 수 있는 수준이라고 생각한다.

<br>

### 2. 아름다운 것 - 언니네 이발관

시간은 흐르고 흘러 2021년 겨울 쯤, `react-query`라는 라이브러리를 접하게 된다. 편하기는 겁나 편한데 `stale-while-revalidate`이 도대체 뭔지 모르겠고, 그래서 HTTP 스펙 어쩌구가 자바스크립트 로직을 어떻게 업데이트 한다는 건지 도저히 감이 오지 않았다. 함수만 넘겨주면 상태가 알아서 변경된다는 것도 잘 상상이 안되었기도 하고, 너무 편한게 있으면 오히려 약간 ‘이래도 되나…’ 하면서 머뭇거리는 성향이라 더 그랬던거 같다.

다시 시간이 흘러 뇌가 완전히 `useQuery`에 절여졌을 때 쯤 우연한 기회로 react-query 내부를 뜯어볼 일이 생겼고, 그 안에서 익숙한 향기를 맡게 되었다.

```tsx
//
const [observer] = React.useState(
  () =>
    new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
      queryClient,
      defaultedOptions
    )
);

const result = observer.getOptimisticResult(defaultedOptions);
```

한줄 씩 설명하라면 또박또박 하기 좀 곤란한 부분도 있겠지만, 대강 훑어보면 결국 서두에서 훑어봤던 redux의 그것과 매우 흡사하다는 사실을 알 수 있다. `useBaseQuery`를 기반으로 `useQuery`, `useMutation` 등의 hook이 만들어지고, mount 될 시점에 observer를 하나 생성하여 useState에 담아둔다.

인자로 넘겨지고 있는 `queryClient`는 당연하게도 `useQueryClient`에서 왔고, 다시 내부적으로 `useContext`를 사용하고 있음을 짐작할 수 있다. client는 Provider가 mount 되었을 때 생성자 함수에서 내부 `cache` 등의 값을 초기화 한다.

```tsx
export class QueryClient {
  // 생략
  constructor(config: QueryClientConfig = {}) {
    this.queryCache = config.queryCache || new QueryCache()
    this.mutationCache = config.mutationCache || new MutationCache()
    this.logger = config.logger || defaultLogger
    this.defaultOptions = config.defaultOptions || {}
    this.queryDefaults = []
    this.mutationDefaults = []
  }
```

```tsx
export const useQueryClient = ({ context }: ContextOptions = {}) => {
  const queryClient = React.useContext(
    getQueryClientContext(context, React.useContext(QueryClientSharingContext))
  );

  if (!queryClient) {
    throw new Error("No QueryClient set, use QueryClientProvider to set one");
  }

  return queryClient;
};
```

`queryClient`의 생김새를 좀 더 정확히 확인하려면 `QueryObserver`와 이 클래스가 상속받아온 `Subscribable` 클래스를 차례로 타고 올라가야 한다. 이렇게 잠시간의 코드 등반을 끝내고 나면 정상에 올라 그리운 향기가 나는 30여줄의 코드를 만날 수 있다.

```tsx
type Listener = () => void;

export class Subscribable<TListener extends Function = Listener> {
  protected listeners: TListener[];

  constructor() {
    this.listeners = [];
    this.subscribe = this.subscribe.bind(this);
  }

  subscribe(listener: TListener): () => void {
    this.listeners.push(listener as TListener);

    this.onSubscribe();

    return () => {
      this.listeners = this.listeners.filter((x) => x !== listener);
      this.onUnsubscribe();
    };
  }

  hasListeners(): boolean {
    return this.listeners.length > 0;
  }

  protected onSubscribe(): void {
    // Do nothing
  }

  protected onUnsubscribe(): void {
    // Do nothing
  }
}
```

아름답지 않은가…? 사실 이 아름다움은 지난 날의 내가 벌여왔던 분투의 한 챕터가 마무리 된 개인적인 감상에서 기인한 것이 크긴 하다. 여기부터는 조금 개인적인 이야기가 될 것 같다.

나는 첫 직장에서 프론트엔드 개발을 전혀 경험하지 못하고 개발 없는 공부와 티칭만으로 시간을 보내왔다. 내가 가르친 수강생들이 현업에서 이런저런 개발을 경험하는 동안 나는 무쓸모한 사람이 되고 싶지 않았다. 나름의 발버둥을 쳤는데 그 당시 내가 할 수 있었던 최대한이란 아티클을 읽고, 이해되지 않은 것들은 수집해두었다가 여러번 읽는 방식으로 현업의 개발을 상상하는 일이었다. (아티클 스크랩 노션 링크 : [https://bit.ly/30JwEiq](https://bit.ly/30JwEiq))

가치를 부정당할지도 모른다는 위기감이 나를 움직이던 시기에 redux의 구현을 접하게 된 것을 시작이었고, 어떠한 기대도 없이 react-query의 구현을 살피다 문득 익숙한 추억을 발견했을 때의 감정이란. 내겐 그간의 발버둥을 통해 내가 이 세계에 무사히 안착했음을 알리는 하나의 사건이었다. 이 때의 감흥은 결코 잊지 못할 에피소드로 남게 될 것 같다.

이후의 구현은 아래 코드를 읽어보면 어렵지 않게 파악할 수 있을 것 같다. Subscribable은 구독 관련한 기본 기능과, 자식 클래스에서 상속으로 구현해야 하는 두 메서드들의 자리만 만들어두고 있다. QueryObserver에서는 이를 상속받고 추가적으로 `notify`를 구현한다. redux의 dispatch로 보면 될 것 같다.

```tsx
// queryObserver
protected onSubscribe(): void {
  if (this.listeners.length === 1) {
    this.currentQuery.addObserver(this)

    if (shouldFetchOnMount(this.currentQuery, this.options)) {
      this.executeFetch()
    }

    this.updateTimers()
  }
}
// ...
private notify(notifyOptions: NotifyOptions): void {
  notifyManager.batch(() => {
    // First trigger the configuration callbacks
    if (notifyOptions.onSuccess) {
      this.options.onSuccess?.(this.currentResult.data!)
      this.options.onSettled?.(this.currentResult.data!, null)
    } else if (notifyOptions.onError) {
      this.options.onError?.(this.currentResult.error!)
      this.options.onSettled?.(undefined, this.currentResult.error!)
    }

    // Then trigger the listeners
    if (notifyOptions.listeners) {
      this.listeners.forEach((listener) => {
        listener(this.currentResult)
      })
    }

    // Then the cache listeners
    if (notifyOptions.cache) {
      this.client.getQueryCache().notify({
        query: this.currentQuery,
        type: 'observerResultsUpdated',
      })
    }
  })
}
```

이 코드들이 옵저버 패턴이라는 디자인 패턴을 기반으로 작성된 것임을 깨달은 것은 조금 더 이후의 일이었다. 하지만 한편으로는 그게 그렇게 중요한 일일까 싶기도 하다.

> 옵저버 패턴(Observer Pattern)은 한 객체의 상태가 바뀌면 그 객체에 의존하는 다른 객체에게 연락이 가고 자동으로 내용이 갱신되는 방식으로 일대다(one-to-many) 의존성을 정의합니다.
>
> 📕 헤드 퍼스트 디자인 패턴, 87p

<br>

### 3. Postscript

언젠가 한번 쯤은 언니네 이발관의 `아름다운 것` 이라는 노래를 들으며, 이 앨범을 작업하던 시기의 이석원의 일기를 꼭 함께 읽어보시길 바란다. 모두 행복하길.

> 2008년 7월 20일
>
> 벌써 열한번째 믹싱을 했는데도 내가 새로운 주문을 하자 엔지니어가 그자리에서 쓰러져 버렸다. 더이상의 작업이 힘들겠구나..
>
> 난 모든것을 체념하고 팀장에게 전화를 했다. "'아름다운것'을 빼겠습니다."
>
> 팀장이 놀래서 달려왔다. "그곡을 빼면 앨범이 뭐가되요. 안되요."
>
> "저는 이곡을 이렇게 넣을 수는 없어요. 부탁합니다."
>
> 잠시 후 엔지니어(락대성실장)가 진정을 찾고 한번 해보겠다고 했다. 믹싱을 하는동안 팀장과 우리들은 모여서 새벽까지 '아름다운것'에 대해 이야기했다. 그 곡이 어떤 의미를 갖는지, 그 곡이 이번 앨범에서 얼마나 중요한지를 이야기했고, 팀장은 '아름다운것'을 들은 많은 사람들의 이야기를 해주었다. 마침내 락대성이 열두번째 버전을 들고 나왔을때 그것을 듣는 내 가슴이 비로소 요동치기 시작했다.
>
> '이제야 됐구나...'
>
> '아름다운것'은 마지막으로 그렇게, 물론 그 이후 세차례나 더 번복 수정이 있었긴 하지만, 결국 완성할 수 있었다.
>
> 스무살이 넘어서 처음 사랑에 빠졌던 순간을 잊을 수 없다.
>
> 그러나 더욱 잊을 수 없는 순간은 그토록 사랑했던 사람에게서 내 마음이 멀어지는걸 느끼던 순간이었다. 그때의 충격과 상실감을 무엇으로 설명할 수 있을까.
>
> 사랑은 왜 변할까. 마음은 왜 움직이는걸까.
>
> 아무리 많은 눈물로도 그것을 다 표현할 수는 없을 것이다.
