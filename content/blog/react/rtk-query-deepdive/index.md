---
title: 2023-02-01 RTK Query는 어떻게 use이름Query를 만드는가?
date: 2023-02-01
description: 아니 근데 진짜 어케했누?
tags: [React, Development, Redux, RTK Query]
thumbnail: /thumbnails/hello-world.jpg
---

## 1. 사건의 발단

사건의 발단은 아래에 있는 코드에서 부터다. `pokemonApi`라는 값이 `useGetPokemonByNameQuery` 라는 hook을 리턴하고 있는데, 그게 어떻게 가능하냐는 것이다.

```ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Pokemon } from "./types";

// Define a service using a base URL and expected endpoints
export const pokemonApi = createApi({
  reducerPath: "pokemonApi",
  baseQuery: fetchBaseQuery({ baseUrl: "https://pokeapi.co/api/v2/" }),
  endpoints: (builder) => ({
    getPokemonByName: builder.query<Pokemon, string>({
      query: (name) => `pokemon/${name}`,
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetPokemonByNameQuery } = pokemonApi;

/** @link https://redux-toolkit.js.org/rtk-query/overview#basic-usage */
```

그 비밀을 알기 위해서는 결국 `createApi`의 구현을 확인하는 수 밖에 없다. 레포지토리의 주소는 [여기](https://github.com/reduxjs/redux-toolkit) 이다. 레포를 보면 `createApi`는 `buildCreateApi`를 실행한 결과물이라는 사실을 알 수 있다.

<br>

## 2. 코드 뜯어보기

`buildCreateApi`에 모듈을 넘기고 있는데, `coreModule`에는 api 생성에 필수적인 로직들이 들어 있을 듯 하고, `reactHooksModule`에는 api가 react와 호환 가능하도록 기능을 추가해주는 어댑터 역할을 하는 로직이 들어 있을 듯 하다.

그리고 이번 궁금증과는 별개로 이러한 패턴을 잘만 활용하면 확장성 있는 인터페이스를 작성하는데 도움이 될 것 같다는 생각도 든다.

```ts
const createApi = /* @__PURE__ */ buildCreateApi(
  coreModule(),
  reactHooksModule()
);

/** @link https://github.com/reduxjs/redux-toolkit/blob/bdf8af37ec868150c771fb78bf0de99f7984841f/packages/toolkit/src/query/react/index.ts#L19-L22 */
```

아무튼 `reactHooksModule`에 내가 찾고 싶었던 `useGetPokemonByNameQuery`를 만드는 로직이 들어 있을 듯 하다. 여기가 아니라면 달리 어느 곳에 커스텀 훅을 만드는 코드가 있을까? 내부를 살펴보자.

```ts
export const reactHooksModule = ({
  batch = rrBatch,
  useDispatch = rrUseDispatch,
  useSelector = rrUseSelector,
  useStore = rrUseStore,
  unstable__sideEffectsInRender = false,
}: ReactHooksModuleOptions = {}): Module<ReactHooksModule> => ({
  name: reactHooksModuleName,
  init(api, { serializeQueryArgs }, context) {
    // ...
    return {
      injectEndpoint(endpointName, definition) {
        if (isQueryDefinition(definition)) {
          const {
            useQuery,
            useLazyQuery,
            useLazyQuerySubscription,
            useQueryState,
            useQuerySubscription,
          } = buildQueryHooks(endpointName);
          // ...
          (api as any)[`use${capitalize(endpointName)}Query`] = useQuery;
          (api as any)[`useLazy${capitalize(endpointName)}Query`] =
            useLazyQuery;
        } else if (isMutationDefinition(definition)) {
          const useMutation = buildMutationHook(endpointName);
          safeAssign(anyApi.endpoints[endpointName], {
            useMutation,
          });
          (api as any)[`use${capitalize(endpointName)}Mutation`] = useMutation;
        }
      },
    };
  },
});

/** @link https://github.dev/reduxjs/redux-toolkit/blob/bdf8af37ec868150c771fb78bf0de99f7984841f/packages/toolkit/src/query/react/module.ts#L124-L185 */
```

`reactHooksModule`의 반환 값인 `init` 메서드를 살펴보면, 다시 `injectEndpoint`라는 메서드를 반환하고 있다. 이 메서드의 구현을 보면 의문은 꽤나 싱겁게 해결된다. `buildCreateApi`의 최종 리턴값이 될 `api` 객체에 동적으로 키를 할당하고 있는 것이다.

```ts
(api as any)[`use${capitalize(endpointName)}Query`] = useQuery;
```

그리고 이 값에 대한 타입 정보는 아래와 같은 타입으로 정의되어 있다. `infer`와 템플릿 리터럴을 사용하여 `Definitions`의 키를 타입으로 추론하고, 이를 `Capitalize`로 대문자로 바꾼 뒤 `use`와 `Query`를 붙여서 키로 사용하고 있다. 이렇게 하면 `useGetPokemonByNameQuery`와 같은 키를 가진 훅이 동적으로 생성되면서 타입 지원까지 가능한 것으로 보인다.

```ts
export type HooksWithUniqueNames<Definitions extends EndpointDefinitions> =
  keyof Definitions extends infer Keys
    ? Keys extends string
      ? Definitions[Keys] extends { type: DefinitionType.query }
        ? {
            [K in Keys as `use${Capitalize<K>}Query`]: UseQuery<
              Extract<Definitions[K], QueryDefinition<any, any, any, any>>
            >;
          } &
            {
              [K in Keys as `useLazy${Capitalize<K>}Query`]: UseLazyQuery<
                Extract<Definitions[K], QueryDefinition<any, any, any, any>>
              >;
            }
        : Definitions[Keys] extends { type: DefinitionType.mutation }
        ? {
            [K in Keys as `use${Capitalize<K>}Mutation`]: UseMutation<
              Extract<Definitions[K], MutationDefinition<any, any, any, any>>
            >;
          }
        : never
      : never
    : never;
```

<br>

## 3. reactHooksModule 좀 더 살펴보기

궁금증은 풀렸고 `reactHooksModule`을 좀 더 살펴보려고 한다.

이 함수의 실행 결과는 결국 `{ init: 함수 }` 꼴의 객체이다. 이 객체는 아까 위에서 살펴봤던 `buildCreateApi`로 전달되고, 아래와 같이 init 메서드를 대신 호출하게 된다.

```ts
const initializedModules = modules.map((m) =>
  m.init(api as any, optionsWithDefaults as any, context)
);
```

다시 `init` 메서드에서는 `injectEndpoint`를 반환하고 있는데, 이 메서드는 `createApi` 내부에서 `injectEndpoints`를 통해 각 모듈별로 호출된다. 이 과정을 통해 위에서 살펴봤던 `useGetPokemonByNameQuery`와 같은 훅이 생성되는 것이다.

```ts
function injectEndpoints(inject: Parameters<typeof api.injectEndpoints>[0]) {
  const evaluatedEndpoints = inject.endpoints({
    query: (x) => ({ ...x, type: DefinitionType.query } as any),
    mutation: (x) => ({ ...x, type: DefinitionType.mutation } as any),
  });

  for (const [endpointName, definition] of Object.entries(evaluatedEndpoints)) {
    // ...
    context.endpointDefinitions[endpointName] = definition;
    for (const m of initializedModules) {
      m.injectEndpoint(endpointName, definition);
    }
  }

  return api as any;
}

return api.injectEndpoints({ endpoints: options.endpoints as any });

/** @link https://github.dev/reduxjs/redux-toolkit/blob/bdf8af37ec868150c771fb78bf0de99f7984841f/packages/toolkit/src/query/createApi.ts#L316-L359 */
```

## 4. 마치며

우연한 기회로 뜯어보게 되었고 이번에 살펴본 부분이 RTK Query의 핵심 로직도 아니지만 궁금한 부분이 생겼을 때 직접 열어보며 확인하는 경험을 해볼 수 있어서 좋았다.

그 과정에서 `build` 함수를 나누고, 인자로 각 기능을 담은 `module` 객체를 넘겨주는 패턴을 발견했다. 결국 서비스가 고도화되면서 높아지는 복잡도를 적절한 추상화 레이어 도입과 인터페이스 설계로 해결해야 하는데 좋은 예시를 발견할 수 있었다.

앞으로 더 많은 라이브러리들의 내부 구현을 살펴보고 그 과정에서 얻는 작은 깨달음들을(큰 인사이트가 아닌 단순 기록일지라도) 쪽글 형태로라도 기록해보려고 한다.
