---
title: 2023-09-23 ChatGPT로 SWR 컨트리뷰트 날로 먹어보기
date: 2023-09-23
description: 헤이 GPT, 컨트리뷰트 "해 줘"
tags: [Article]
thumbnail: /thumbnails/hello-world.jpg
---

> 주의: 이 글은 2023-06-20를 기준으로 작성되었으며, 약간의 윤문을 거쳐 최근 발행되었습니다.

얼마 전 `SWR`에 내가 올린 PR(https://github.com/vercel/swr/pull/2666) 이 머지되었다. 동네방네 떠들고 다닌 걸로 모자라 블로그까지 쓴다.

리액트와 SWR 공식 문서 오타 수정한 건이나 `react-awesome-query-builder` 처럼 업무하면서 만져야 했던 라이브러리의 타입 수정 정도는 기여를 해봤고, 이번에도 역시 타입 관련 수정이기는 했으나 좀 더 대중적으로 쓰이는 규모 있는 라이브러리에 코드가 머지된 건 처음이라서 기분이 좋았다.

하지만 기여의 99%는 GPT가 해준 것이다. 이 재미있는 사실을 굳이 블로그로 남겨보고자 한다. 앞으로는 지금보다 더 많이 날로 먹으면서 내 능력보다 더 많은 일을 해보고 싶다 :)

## What's the problem?

일단 발단은 회사 코드 베이스의 SWR을 1에서 2버전으로 업데이트 하면서 처음으로 `useSWRMutation`을 사용해보았다. 별 문제 없이 쓰던 와중 아래와 같은 코드가 문제가 되었다.

```tsx
import useSWRMutation from "swr/mutation";

// ...

const { trigger: registerDeviceTrigger } = useSWRMutation(
  getRegisterDeviceRoute(),
  (_, { arg }: { arg?: number }) => registerDevice(arg)
);

// ...

const attemptRegisterDevice = async () => {
  try {
    await registerDeviceTrigger(undefined); // TO-BE: await registerDeviceTrigger()
    // ...
  } catch (e) {
    // ...
  }
};
```

`registerDeviceTrigger`는 React Query로 치면 `mutate` 함수이고, `useSWRMutation`의 두번째 인자로 들어온 함수의 두번째 인자 자리에서 볼 수 있는 `arg`는 mutate 함수의 인자로 넘겨 받을 값을 정의한다고 보면 된다. 즉, `registerDeviceTrigger`의 인자로 들어올 수 있는 값은 `number | undefined`이다. 거의 대부분 number를 넘겨주는 상황이겠지만, 문제는 인자가 `undefined`로 평가되어야 하는 상황이다. 함수의 인자로 undefined로 처리되어야 한다면 보통은 함수에 인자를 넣지 않고 호출하는 것이 방법이 될 수 있다.

하지만 타입 시스템의 입장은 좀 다르다. 값의 관점에서야 함수 인자에 값을 넣지 않든 undefined를 명시적으로 넣든 차이가 없겠지만, 함수 오버로딩 같은 것들을 생각해보면 함수 인자에 들어오는 갯수에 차이가 있는 것은 그 자체로 커다란 차이다. 아래 타입을 보자.

```ts
trigger: [ExtraArg] extends [never]
  ? TriggerWithoutArgs<Data, Error, SWRMutationKey, ExtraArg>
  : TriggerWithArgs<Data, Error, SWRMutationKey, ExtraArg>
```

`ExtraArg`는 위에서 언급한 trigger 함수의 인자로 넘겨지는 `arg` 값으로 보면 된다. `ExtraArg`가 `never`라면 `TriggerWithoutArgs` 타입으로, `ExtraArg`가 `undefined`라면 `TriggerWithArgs` 타입으로 평가된다.

```ts
// TriggerWithoutArgs
extraArgument?: null,
options?: SWRMutationConfiguration<
  Data,
  Error,
  SWRMutationKey,
  ExtraArg,
  SWRData
>

// TriggerWithArgs
extraArgument: ExtraArg,
options?: SWRMutationConfiguration<
  Data,
  Error,
  SWRMutationKey,
  ExtraArg,
  SWRData
>
```

즉, 타입 상 인자가 존재할 수 있는 경우 `trigger`의 인자 갯수는 항상 1개 이상이어야 한다. 이는 일견 타당해보이나 인자로 `undefined`를 고려해야 할 때는 명시적으로 `undefined`를 넘겨주지 않고 `trigger()`와 같이 호출하면 타입 에러가 발생하는... 이상한 상황이 펼쳐진다.

## Let's solve it!

문제를 파악했고 https://github.com/vercel/swr/issues/2665 에 먼저 이슈를 작성했다. 나는 영어를 잘 못하므로 먼저 한글로 작성한 뒤 GPT에게 모든 작문을 맡겼다. 잘못된 문장은 없으려나 노심초사 하던 중 메인테이너가 답변을 달아주었다. 하트가 달려 있으니 문제는 없었던거겠지... 고맙다 AI...

> Thanks for reporting!
>
> > May I create a PR for this issue?
>
> Sure ! That would be awesome ❤️
>
> Also you could always ping me if you have any question

하지만 내 PR(https://github.com/vercel/swr/pull/2666) 의 첫 커밋은 `trigger`에 옵셔널 표기를 더한 것이었는데... 아닌 줄을 알면서도 테스트 코드를 지우고(ㅋㅋㅋ) 올렸다. 역시나 회초리가 날아왔다.

> I think the correct way to fix this problem is to have a new `TriggerWithOptionsArgs` type.
>
> So you can improve the type inference implementation here.
>
> https://github.com/vercel/swr/blob/7badbb9d428d2ac48873b3a3f11d54e7cec0c7cf/mutation/types.ts#L142-L144
>
> `ExtraArg = never` -> `TriggerWithoutArgs` `ExtraArg = number | undefined` -> `TriggerWithOptionsArgs` `ExtraArg = number` -> `TriggerWithArgs`
>
> Also. You need to add a new test for optional `arg`

그래도 구체적으로 어떻게 변경할지를 제안 받으니 길이 보이는듯 했다. 하지만 제네릭 서커스에 약한 나로서는 어떻게 구현을 해야 할지 잘 감이 오지 않았는데, 이 역시도 GPT의 도움을 받아 방향을 잡을 수 있었다.

GPT와 한참을 핑퐁을 나눈 뒤에야 거의 완벽한 정답에 도달할 수 있었다.

> 앗, 그렇네요. `[ExtraArg] extends [undefined | any]` 조건은 사실상 항상 참이므로 `TriggerWithArgs`로 빠지는 경우가 사실상 없게 됩니다. 이를 해결하기 위해 `ExtraArg`가 `undefined`를 포함하는지 확인하는 조건을 좀 더 세밀하게 만들어야 합니다.
>
> `ExtraArg`가 `undefined`를 포함하는지 확인하려면 `undefined`가 `ExtraArg`의 subtype인지 확인해야 합니다. TypeScript에서 이를 확인하는 방법은 다음과 같습니다:
>
> ```ts
> type IsUndefinedIncluded<T> = undefined extends T ? true : false;
> ```
>
> 이제 `IsUndefinedIncluded` 타입을 사용하여 `trigger` 필드의 타입을 다시 수정하겠습니다:
>
> ```ts
> interface SWRMutationResponse<
>   Data = any,
>   Error = any,
>   ExtraArg = never,
>   SWRMutationKey extends Key = Key
> > extends Pick<SWRResponse<Data, Error>, "data" | "error"> {
>   // ...
>   trigger: [ExtraArg] extends [never]
>     ? TriggerWithoutArgs<Data, Error, ExtraArg, SWRMutationKey>
>     : IsUndefinedIncluded<ExtraArg> extends true
>     ? TriggerWithOptionsArgs<Data, Error, SWRMutationKey, ExtraArg>
>     : TriggerWithArgs<Data, Error, SWRMutationKey, ExtraArg>;
>   // ...
> }
> ```
>
> 이제 `trigger` 필드는 `ExtraArg`가 `undefined`를 포함하면 `TriggerWithOptionsArgs` 타입을, 그렇지 않으면 `TriggerWithArgs` 타입을 사용하게 됩니다. 이렇게 하면 `ExtraArg`가 `undefined`를 포함하는 경우와 그렇지 않은 경우를 모두 적절하게 처리할 수 있습니다.

그리곤 역시나 GPT에게 메인테이너에게 답변할 내용에 대해 번역을 부탁하여 다시 한번 코멘트를 남겼고, 메인테이너가 잘 알아들었다! 솔직히 나는 컨트리뷰트 한 내용 자체보다도 외국의 개발자와 영어로 기술적인 문제에 대해 소통을 하고 있다는 사실 자체가 더 신기했던 것도 같다.

사실 중간중간 생략된 것도 있고, pnpm 환경 세팅 하느라 번거로웠던 부분도 있지만... 아무튼 약간의 기다림과 함께 내 변경 사항은 머지되었고 `swr@2.2.0`에 반영되어 배포됐다!

그리고 소소하게나마 뿌듯했던 점은 누군가 나의 기여로 인해 도움을 받았다는 점이다. 앞으로도 이런 기회가 더 많이 생기면 좋겠다. 끝!

> I am also encountering this issue in v2.2.1-beta.0. Would be nice not to have to update 200+ api calls with an explicit `undefined` when updating.
>
> Also appears that its no longer possible to pass unknown or any as the extra arg in the case that the trigger payload is not known. Would expect to be able to pass nothing, or an object in this case to .trigger
