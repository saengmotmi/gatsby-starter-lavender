---
title: 2023-01-28 Yarn Berry 마이그레이션 후기
date: 2023-01-28
description: 이제는 없으면 섭섭한 Yarn PnP...
tags: [yarn, yarn berry, zero install, 패키지 매니저]
thumbnail: /thumbnails/hello-world.jpg
---

<br />

## "Yarn Berry 쫌 멋도리 나든데 우리도 해볼까?"

계기는 단순했습니다. 빌드 시간을 조금이라도 줄여볼 수는 없을까?

현재 리멤버는 `AWS CodePipeline` 을 사용하여 웹 서비스의 CI/CD 프로세스를 자동화 하고 있습니다.

main 브랜치에 PR이 머지되어 새로운 커밋이 생기면 pipeline이 트리거 되고, `AWS CodeBuild` 와 `CodeDeploy` 를 차례로 거쳐 최종적으로 Slack Webhook을 통해 배포 완료를 알리는 구조입니다. (+ `Github Action` 을 통해 Jira Issue Release도 자동화 하고 있습니다)

여섯 명의 프론트엔드 개발자가 프로덕션과 테스트 환경(alpha, bravo)을 합쳐 배포하는 횟수를 따져보면 하루에도 수차례, 많게는 수십 차례는 될텐데요. 이때, 최초 머지로 부터 최종 배포 완료 시점까지의 간극이 작을 수록 장애 상황 등에 보다 신속하게 대응할 수 있으며, 개발 과정에서 빌드를 기다리는 시간이 줄어 DX(Developer eXperience) 측면에서 개선의 여지가 있겠다고 생각했습니다.

오늘 소개 드리고자 하는 `yarn berry` 는 2.x 버전 이상의 yarn 프로젝트를 지칭하는 용어입니다. 처음 yarn berry 라는 키워드를 들었을 땐, 이처럼 단순히 빌드 시간을 일부 단축 시켜주고 버전이 높다는 관점에서 관심을 가지게 되었습니다.

기존 리멤버의 웹 서비스는 yarn 1.x 버전의 패키지 매니저를 사용해왔습니다. 현재 기존 1.x 버전은 classic 으로 명명되었으며, 새로운 기능 개발은 이루어지지 않고 유지보수만 이루어지는 레거시 프로젝트가 되었습니다.

즉, yarn classic을 사용하고 있는 상황에서 yarn이냐 npm이냐 pnpm이냐 하는 선택지를 고민하는게 아니라면 점진적으로 berry로 마이그레이션하는게 바람직하다고 생각합니다. 참고로 새 프로젝트를 만드는 시점이라면 `yarn init -2` 명령으로 간단하게 프로젝트를 생성할 수 있습니다.

해당 프로젝트에 대한 보다 상세한 정보는 [yarnpkg/berry](https://github.com/yarnpkg/berry)에서 확인하실 수 있습니다.

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215241351-e7c73027-f829-459c-ab1e-f6e2d15f474c.png" alt="yarn classic" width="number" />
</p>

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215241355-efcfd03d-1b08-4e64-a875-acf658c21eb8.png" alt="yarn berry" width="number" />
yarn classic에 대한 추가적인 기능 개발은 더 이상 진행되고 있지 않다.
</p>

<br />

## Yarn Berry를 써야 할 결심

yarn의 새로운 버전은 `node_modules`라는 설계 그 자체로 인해 생기는 막대한 비효율을 해결하고자 기획 되었습니다. 물론 `npm` 은 그간 Node 생태계를 위해 많은 일을 해왔지만 가장 첫 번째로 꼽힐 용량 문제를 제외하고서라도 많은 문제를 안고 있었습니다.

<br />

### 1) 모듈 탐색 과정의 비효율

예를 들어 막대한 파일 / 폴더 탐색 비용 문제가 있습니다. yarn berry 문서에 따르면 node_modules가 생성되는 로직은 단순히 패키지를 한뭉텅이 복사해넣는 디스크 I/O 작업일 뿐이기 때문에 느립니다. 메모리에서 자료구조로 다루고 있는 것이 아니다보니 추가적인 최적화 과정을 거치기도 어려웠습니다. yarn 개발진은 이러한 이유들로 더 이상 최적화 할 여지가 없었다고 문서에서 밝히고 있기도 합니다.

<br />

### 2) 유령 의존성 (Phantom Dependency)

물론 npm은 속도 문제를 개선하기 위해 호이스팅 등 최적화 알고리즘을 도입하였으나 부작용으로 `유령 의존성` 이라는 문제를 새로 낳고 말았습니다.

<p align="center"> 
  <img src="https://classic.yarnpkg.com/assets/posts/2018-02-15-nohoist/standalone-2.svg" alt="Phantom Dependency" width="number" />
https://classic.yarnpkg.com/blog/2018/02/15/nohoist/
</p>

npm, yarn classic 등은 중복 설치를 방지하기 위해 위 그림처럼 종속성 트리 아래에 존재하는 패키지들을 호이스팅 & 병합합니다. 그렇게 하면 패키지 최상위에서 트리 깊이 탐색하지 않고 루트 경로에서 원하는 패키지를 탐색할 수 있으므로 효율적입니다.

하지만 이런 효율의 반대 급부로는 직접 설치하지 않고, 간접 설치한 종속성에 개발자가 접근할 수 있게 되는 상황이 벌어지기도 합니다. 존재하지 않는 종속성에 의존하는 코드가 왕왕 발생할 수 있다는 뜻입니다. 이를 `유령 의존성`이라 합니다. 앞서 언급한 node_modules의 단점으로 인해 의존성 트리의 유효성을 검증하기 어렵다는 것도 한 몫을 했습니다.

yarn berry에서는 이런 식의 호이스팅 동작이 일어나지 않도록 `nohoist` 옵션이 기본적으로 활성화 되어 있습니다.

<br />

### 3) Plug'n'Play (PnP)

- [https://yarnpkg.com/features/pnp](https://yarnpkg.com/features/pnp)
- [https://classic.yarnpkg.com/lang/en/docs/pnp/](https://classic.yarnpkg.com/lang/en/docs/pnp/)
- [https://github.com/yarnpkg/berry/issues/850](https://github.com/yarnpkg/berry/issues/850)

yarn berry는 **Plug'n'Play(PnP)** 기술을 사용하여 이러한 문제들을 해결합니다.

yarn berry는 node_modules를 사용하지 않습니다. 대신 `.yarn` 경로 하위에 의존성들을 `.zip` 포맷으로 저장하고, `.pnp.cjs` 파일을 생성하여 의존성 트리 정보를 단일 파일에 저장합니다. 이를 `인터페이스 링커 (Interface Linker)` 라고 합니다.

> Linkers are the glue between the logical dependency tree and the way it's represented on the filesystem. Their main use is to take the package data and put them on the filesystem in a way that their target environment will understand (for example, in Node's case, it will be to generate a .pnp.cjs file).

링커를 논리적 종속성 트리와 파일 시스템 사이에 있는 일종의 접착제로도 비유할 수 있습니다. 이러한 링커를 사용함으로서 패키지를 검색하기 위한 비효율적이고 반복적인 디스크 I/O로부터 벗어날 수 있게 되었습니다. 의존성 또한 쉽게 검증할 수 있어 유령 의존성 문제도 해결 가능해졌습니다.

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215241947-c7bdc747-5930-4e9b-b068-9f5a1bd06c59.png" alt="pnp" width="number" />
.pnp.cjs 파일
</p>

위와 같이 .pnp.cjs는 의존성 트리를 중첩된 맵으로 표현하였습니다. 기존 Node 가 파일시스템에 접근하여 직접 I/O 를 실행하던 require 문의 비효율을 자료구조를 메모리에 올리는 방식으로 탐색을 최적화한 것입니다.

의존성 압축을 통하여 디스크 용량 절감 효과도 볼 수 있습니다. `du -sh` 명령어로 확인해보았을 때, 어드민 서비스 기준 `913MB → 247MB` 로 기존 패키지 용량 대비 약 `27%` 수준으로 패키지 관련 용량이 감소한 것을 확인할 수 있습니다.

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215241955-a7b64cd0-e15c-49c8-8a0a-b7746d5625a3.png" alt="cache" width="number" />
.yarn/cache에 다운로드 된 종속성들
</p>

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215241959-a17f711b-66f1-4494-810f-9f70744d039c.png" alt="cache" width="number" />
yarn classic 에서의 node_modules 크기 (913MB)
</p>

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215241967-11476f03-2757-4aaf-9913-323f64fc87a4.png" alt="cache" width="number" />
yarn berry 에서의 .yarn 크기 (247MB)
</p>

다만 .yarnrc.yml의 링커 설정을 pnp가 아닌 `node-modules` 로 하게 된다면 기존처럼 node_modules를 설치하여 의존성을 관리하게 됩니다. 하지만 이렇게 사용할 경우 앞서 설명드린 PnP의 장점들을 활용하지 못하게 됩니다.

이에 대한 예시로 최근 `Vercel` 에서 모노레포 툴링으로 발표한 `터보레포` 의 경우 패키지 매니저 중 `pnpm` 의 pnp 모드만 지원하고 있고, 메인테이너는 yarn berry의 경우 지원 계획을 취소한 상태입니다. 이 경우 앞서 말씀드린 방식으로 berry를 사용해야 합니다. 관련 이슈는 [여기](https://github.com/vercel/turbo/issues/693#issuecomment-1278886166)에서 확인하실 수 있습니다.

<br />

### 4) Zero-Installs

- [https://yarnpkg.com/features/zero-installs](https://yarnpkg.com/features/zero-installs)

`.yarn` 폴더에 받아놓은 파일들은 오프라인 캐시 역할 또한 할 수 있습니다. 커밋에 포함시켜 github에 프로젝트 코드와 함께 올려두면 어디서든 같은 환경에서 실행 가능할 것을 보장할 수 있으며 별도의 설치 과정도 필요가 없습니다.

만약 의존성에 변경이 발생하더라도 git 상에서 diff로 잡히므로 쉽게 파악 가능합니다. 개발자들 간 node_modules가 동일한지 체크할 필요가 없다는 뜻입니다.

현재 브랜치에 맞는 package.json에 맞게 node_modules를 갱신하기 위한 반복적인 yarn install을 할 필요 또한 없습니다. 브랜치를 체크아웃할 때마다 `.yarn/cache` 폴더에 있는 의존성도 커밋으로 잡혀있기 때문에 여타 파일들처럼 파일로 취급되어 함께 변경되기 때문입니다.

<br />

## 적용 방법 & 결과

[호환성 테이블](https://yarnpkg.com/features/pnp#compatibility-table)에서 지원하는 버전에 해당만 한다면 마이그레이션 자체는 어렵지 않습니다. `yarn`이 이미 설치되어 있다는 가정 하에 [yarn 공식 문서](https://yarnpkg.com/getting-started/migration)에서 말하는 대로 진행합니다. 정말 해결할 수 없는 문제가 있다면 nodeLinker 설정을 loose 혹은 node-modules로 바꿔야([링크](https://yarnpkg.com/getting-started/migration#if-required-enable-the-node-modules-plugin)) 합니다.

```yaml
nodeLinker : "pnp"
# OR
nodeLinker : "node-modules"
```

일반적이지는 않지만 깨져 있는 종속성 트리를 수동으로 추가해주어야 하는 경우가 있을 수 있습니다. 이때는 일반적인 설치 방식으로 package.json에 종속성으로 추가해주거나, packageExtensions를 사용([링크](https://yarnpkg.com/getting-started/migration#a-package-is-trying-to-access-another-package-))하여 보완해줄 수 있습니다.

```yaml
packageExtensions:
  "debug@*":
    peerDependenciesMeta:
      "supports-color":
        optional: true
```

**1) yarn 버전 변경**

```bash
> yarn set version berry # v1.x로 돌아가려면 yarn set version classic
```

**2) `.gitignore` 설정**

[문서](https://yarnpkg.com/getting-started/qa#which-files-should-be-gitignored)(Zero-Installs 기준)를 따라 `.gitignore`에 아래 경로를 추가해줍니다. `!` 는 제외할(gitignore) 경로에서 빼달라는 뜻이므로 `.yarn` 이하 경로 중 포함시킬 경로들을 명시한 것으로 생각하시면 됩니다. 부정의 부정이라 좀 헷갈리긴 하네요. 각 경로의 역할에 대한 자세한 설명은 공식 문서에서 확인하실 수 있습니다.

```bash
.yarn/*
!.yarn/cache
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions
```

**3) `.npmrc`, `.yarnrc`를 `.yarnrc.yml` 로 마이그레이션**

berry로 버전을 변경하게 되면 루트 경로에 .yarnrc.yml 파일이 생성됩니다. 기존에 있던 .npmrc, .yarnrc는 지원하지 않기 때문에 [문서](https://yarnpkg.com/configuration/yarnrc)를 확인하여 각각의 옵션을 마이그레이션 해주면 됩니다.

.yarnrc.yml에서 nodeLinker를 `node-modules` 로 입력하면 classic에서 하던 대로 종속성들을 node_modules에서 관리하게 됩니다. pnp 모드를 사용할 것이므로 `pnp` 라고 적혀 있는지 확인합니다.

또한 저희 프로젝트에서는 github packages로 배포한 종속성을 포함하고 있어 `yarnrc.yml` 에 추가적으로 관련 설정을 추가해줍니다. 배포 시에는 `Dockerfile`에서 토큰 값을 넣어줍니다.

```yaml
nodeLinker: pnp

yarnPath: .yarn/releases/yarn-3.3.0.cjs

npmScopes:
  organization이름(ex. dramancompany):
    npmAlwaysAuth: true
    # NOTE: 로컬에서 설치 시 터미널에 'export NPM_AUTH_TOKEN=...' 명령어로 환경변수를 설정합니다.
    npmAuthToken: ${NPM_AUTH_TOKEN} # https://github.com/yarnpkg/berry/pull/1341
    npmRegistryServer: "https://npm.pkg.github.com"
```

상기 세팅이 모두 끝나면 `yarn install` 을 입력하여 yarn classic에서 berry로 마이그레이션을 진행합니다.

```bash
> yarn install
```

이 과정에서 깨진 의존성들이 발견되곤 합니다. `styled-components` 사용 시 `react-is` 를 설치하라는 에러 메시지가 뜨는 것이 대표적인 케이스입니다. 터미널에 뜨는 에러 메시지를 확인하여 필요한 의존성들을 추가 설치해줍니다.

```yaml
packageExtensions:
  styled-components@*:
    dependencies:
      react-is: "*"
```

설치 시 `~/.yarn/berry/cache` 전역 경로에도 함께 설치가 되므로 `yarn cache clean` 등의 명령어를 통해 의존성이 완전히 설치되지 않은 상황을 재현하고 싶을 경우 `yarn cache clean --mirror` 를 입력([관련 문서](https://yarnpkg.com/features/offline-cache#cleaning-the-cache))해야 하므로 유의할 필요가 있습니다.

여기까지 마무리 되었으면 한번 커밋하여 진행 상황을 저장합니다.

**4) yarn berry를 IDE와 통합 (with. TypeScript)**

지금까지는 패키지 매니저 레벨에서 마이그레이션 할 것들을 처리해주었습니다. 이제 IDE에 의존성과 타입 정보를 node_modules가 아닌 .yarn에서 읽어오도록 알려주어야 합니다. VSCode 기준으로 설명하겠습니다.

일단 아래 세 가지 요소들을 설치합니다.

- `VSCode Extension에서 ZipFS 설치` (zip 파일로 설치된 종속성을 읽어올 수 있도록)

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215242255-06b1fe32-b8df-4434-816e-7d0c7b0bd779.png" alt="cache" width="number" />
ZipFS 설치
</p>

- `yarn install -D typescript eslint prettier`
- `yarn dlx @yarnpkg/sdks vscode` (yarn dlx = npx) 를 실행하여 관련 세팅을 포함한 `.vscode` 폴더를 생성합니다.
  ```json
  {
    "recommendations": [
      "arcanis.vscode-zipfs",
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode"
    ]
  }
  ```
  ```tsx
  {
    "search.exclude": {
      "**/.yarn": true,
      "**/.pnp.*": true
    },
    "eslint.nodePath": ".yarn/sdks",
    "prettier.prettierPath": ".yarn/sdks/prettier/index.js",
    "typescript.tsdk": ".yarn/sdks/typescript/lib",
    "typescript.enablePromptUseWorkspaceTsdk": true
  }
  ```
  - 설치가 완료되면 아무 타입스크립트 파일이나 들어간 다음
  - 우측 하단 TypeScript 클릭 or `cmd + shift + p` 를 눌러 TypeScript 검색

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215242264-c9d267c6-a43f-427e-951d-9d0bdd166f42.png" alt="cache" width="number" />
</p>

- Use Workspace Version 클릭

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215242269-6d5640db-1ed4-46f1-9242-d4ae20642188.png" alt="cache" width="number" />
</p>

여기까지 진행 한 뒤 다시 한번 진행 상황 저장을 위해 커밋합니다.

**5) Dockerfile 수정**

이상 로컬에서 필요한 작업들은 모두 완료를 해주었습니다. 배포 시 도커를 사용하고 있으므로 `Dockerfile`에도 필요한 작업을 해줍니다. 아래와 같이 작업을 해주었으며 필요한 설명은 파일 내 주석으로 추가해두었습니다.

두 가지 정도의 주의사항이 있습니다. 하나는 `yarn berry`는 `Node 16.14+` 버전에서 동작한다는 것이고, 다른 하나는 `yarn berry`는 `zero install`을 사용하기 때문에 `yarn install`을 할 때 `--immutable` 옵션을 사용해야 한다는 것입니다.

다른 하나는 `yarn berry`는 `zero install`을 사용하기 때문에 다음과 같이 관련 파일들을 working directory에 복사해줘야 합니다.

```docker
COPY package* yarn.lock .pnp*     ./
COPY .yarnrc.yml                  ./
COPY .yarn                        ./.yarn
```

위와 같은 과정을 거치면 yarn berry의 zero install을 사용할 수 있게 됩니다. 개선된 빌드 시간은 프로젝트마다 차이가 있으나 지금까지 적용해본 케이스들에서는 약 50초 ~ 1분 정도의 시간 단축이 있었습니니다.

**6) AWS Codebuild에서 Docker Layer가 로컬 캐싱될 수 있도록 세팅**

yarn berry와는 무관한 주제지만, 배포 성능을 개선하는 도중에 진행했던 변경이라 함께 언급해보겠습니다.

도커 파일 내 각 레이어는 변경되지 않는 이상 새롭게 실행될 필요가 없습니다. 변경 사항 없을 시 CodeBuild가 자연스럽게 Docker Layer 캐싱을 이용할 수 있도록 세팅을 변경해주도록 하겠습니다.

현재 저희는 AWS CodePipeline을 사용하여 배포하고 있으며, 빌드 단계는 AWS Codebuild를 사용하고 있으므로, 해당 단계에서 생성된 빌드 결과물을 캐싱에 사용할 수 있도록 아래와 같이 체크해줍니다. 다만 이 로컬 캐시의 정확한 캐싱 조건은 조금 더 확인이 필요합니다. ([링크](https://stackoverflow.com/questions/58793704/aws-codebuild-local-cache-failing-to-actually-cache))

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215242409-a7761e7b-6c11-44e1-9371-c22e10085819.png" alt="cache" width="number" />
AWS Codebuild - 편집 - 아티팩트 - 캐싱 메뉴 하단
</p>

이 과정에서 기존에 잘못 세팅되어 있던 Codebuild의 Buildspec([링크](https://dramancompany.slack.com/archives/C020CUB9P0Q/p1667891554407869))을 바로 잡아 캐싱이 작동하도록 함으로서 추가적으로 빌드 시간을 단축하였습니다. foa-v2 기준 약 1분 30초 가량 단축한 것으로 추정됩니다.

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215242427-8745f517-9959-4208-a0ed-e16ba3a10dbd.png" alt="cache" width="number" />
  개선 전
</p>

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215242431-961903a3-5250-49e7-9c33-a88f34529c15.png" alt="cache" width="number" />
  개선 후
</p>

한 프로젝트는 언급드린 두 가지 조치를 통하여 프로젝트에 따라 빌드 시간이 5분 30초 → 1분 50초로 드라마틱하게 감소하기도 했는데, 프로젝트와 빌드 시점에 따라 개선되는 폭은 상이할 것으로 생각됩니다.

<br />

## 트러블 슈팅

**1) 커밋에 포함되지 않는 종속성 문제**

`yarn install` 시 커밋에 포함되지 않는 파일들이 있습니다. `.yarn/install-state.gz` 같은 경우 최적화 관련 파일이기 때문에 애초에 커밋할 필요 없다고 공식 문서에서 안내하고 있습니다.

한편 예상치 못한 예외 케이스도 있었습니다. Next.js 등에 포함되는 `swc`의 경우 운영체제에 종속되는 부분이 있다보니 커밋에 포함시킬 경우 실행환경에 따라 문제를 일으킬 수 있어 커밋에서 제외되고 있습니다. 따라서 swc를 사용한다면 정상적인 빌드를 위해 최초 1회 설치 명령어가 필요합니다.

만약 설치를 실행하지 않으면 아래와 같은 오류가 발생합니다.

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215242557-6ceaf60b-7044-42e1-99ac-e975823d0088.png" alt="cache" width="number" />
</p>

설치 후 추가된 파일들이 .gitignore에 등록되어 있으며, 폴더명으로부터 플랫폼 종속적이라는 사실을 추측해볼 수 있습니다.

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215242563-29edb728-b040-402d-bcdb-dcf90a104a80.png" alt="cache" width="number" />
</p>

<br />

**2) ESLint import/order 관련 이슈**

`eslint`에서 import 관련 룰을 사용하고 있다면 추가 세팅이 필요합니다. `eslint-plugin-import` 에서 제공하는 `import/order` 옵션을 활용해 다음과 같이 외부 의존성과 내부 의존성을 구분지어 줄바꿈 해주고 있었습니다.

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215242568-de643261-f829-4f7a-a5c3-ebff19da0a53.png" alt="cache" width="number" />
</p>

이 Lint 규칙이 yarn berry 적용 후 제대로 작동하지 않는 것을 발견하였습니다. 아마 기존 node_modules에서 읽어오는 동작으로부터 영향을 받았을 것이라 생각하여 검색해본 결과, [관련 이슈](https://github.com/import-js/eslint-plugin-import/issues/2164)로부터 힌트를 얻어 [README](https://github.com/import-js/eslint-plugin-import#importexternal-module-folders) 내에 언급된 해결책을 찾을 수 있었습니다.

> 🗣️ If you are using yarn PnP as your package manager, add the .yarn folder and all your installed dependencies will be considered as external, instead of internal.

이 문제를 해결하려면 `.eslintrc.js` 에 다음과 같이 옵션을 추가하여 `.yarn` 경로를 외부 의존성으로 인식시켜주면 됩니다.

```tsx
// .eslintrc.js
// ...
  settings: {
    'import/external-module-folders': ['.yarn'],
// ...
```

혹은 아래와 같이 직접 package.json을 읽어와 external 경로로 등록해줄 수도 있습니다만, 전자의 방식을 추천드립니다.

```tsx
// .eslintrc.js
const getPackageJson = () =>
  require(path.resolve(process.cwd(), 'package.json'));

const getExternals = () => {
  const { dependencies, peerDependencies, devDependencies } = getPackageJson();

  return Object.keys({
    ...dependencies,
    ...peerDependencies,
    ...devDependencies,
  });
};

// ...
    'import/order': [
      'error',
      {
        groups: [
          ['builtin', 'external'],
          ['internal', 'parent', 'sibling'],
        ],
        pathGroups: [
          ...getExternals().map((name) => ({
            pattern: name,
            group: 'external',
          })),
          ...getExternals().map((name) => ({
            pattern: `${name}/**`,
            group: 'external',
          })),
// ...
```

<br />

**3) yarn berry에서 pre-hook 지원하지 않음**

yarn 2.x 버전 부터는 pre-hook(ex. `preinstall`, `prepare` 등) 을 지원하지 않습니다. [문서](https://yarnpkg.com/advanced/lifecycle-scripts#gatsby-focus-wrapper)에 따르면 이는 사이드 이펙트를 줄이기 위한 의도적인 변경이라고 하며, 호환성을 위해서 `preinstall`과 `install`은 `postinstall`의 일부로서 실행됩니다.

기존에 husky 등을 사용하기 위해 걸어둔 pre-hook이 있었다면 yarn berry 업그레이드 후 작동하지 않을 것이므로 이에 대한 처리가 필요합니다.

```tsx
"postinstall": "husky install"
```

<br />

**4) yarn berry와 vite를 함께 사용할 때 storybook이 실행되지 않는 문제**

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215242682-106bffb8-6eb7-452a-86f1-869726aa4b17.png" alt="cache" width="number" />
</p>

이 경우는 누락된 devDependencies를 다 깔아주면 되는 문제로 간단하게 해결할 수 있었습니다. 관련 이슈는 [여기](https://github.com/storybookjs/builder-vite/issues/141)서 찾아볼 수 있습니다.

하지만 이 종속성들을 설치하고 나서도 storybook이 정상적으로 실행되지는 않았는데, 스토리북으로 띄운 화면 상의 콘솔에 `"Cannot access "./util.inspect.custom" in client code."` 라는 에러가 발생했습니다. pnp와 vite 사이에서만 발생하는 문제로 build 과정에서 서버 / 클라이언트 환경에서 실행되는 코드들이 적절히 처리되지 않아서 생기는 문제로 이해했습니다. vite 측에서 폴리필을 추가하여 해결한 것으로 보이며, 관련 이슈는 [여기](https://github.com/vitejs/vite/issues/9238), [여기2](https://github.com/vitejs/vite/issues/7576)에서 찾아볼 수 있습니다.

<p align="center"> 
  <img src="https://user-images.githubusercontent.com/35240142/215242692-31961169-1beb-4de4-9d3a-a564b61c0ed4.png" alt="cache" width="number" />
</p>

이 외에도 vite와의 조합에서 생기는 문제는 또 있었는데요. build를 실행했을 시 종속성을 제대로 찾지 못하는 문제였습니다. 이 문제는 yarn berry를 3.3.0으로 올리고 vscode sdk를 재설치한 뒤, vite를 3.2.0 버전으로 업데이트 하여 해결했습니다. 관련 이슈는 [여기](https://github.com/yarnpkg/berry/issues/4872#issuecomment-1284318301)에서 찾아볼 수 있습니다.

<br />

## 마치며

yarn berry와 pnp는 과감하면서도 멋진 진전이라고 생각합니다. 위에 말씀드린 이슈들처럼 아직 사용자들이 직접 부딪혀야 하는 문제들이 산재해있지만, 기술이 처음 공개되었을 때와 비교하면 현재 이 리스크들은 감내할 수 있는 수준이라고 생각합니다. `yarn unplug`, `yarn why`, `yarn patch` 등의 기능을 활용하여 디버깅하고, 긴급한 상황에서는 `nodeLinker: node-modules` 로 되돌리거나 `pnpMode: loose` 등의 절충점이 존재하므로 자신 있게 도입해볼 수 있을 것 같습니다.

사실 yarn berry를 도입하는 과정에서 가장 좋았던 점은 성능상의 이점보다도, yarn이나 여러 패키지 내부의 코드를 살펴보며 동작 원리를 가늠하거나, Github에 올라온 issue들을 싹싹 긁어가며 읽고, peerDependencies 등 종속성들 간의 관계를 생각하며 패키지를 이리저리 설치해보던 시간들이었습니다.

가벼운 마음으로 시작했지만 역시 어떤 기술이든 직접 만져보고 굴려볼 때 이해도가 더 높아진다는 사실을 새삼스레 곱씹게 되네요. 꼭 적극적으로 도입을 고려해보셨으면 좋겠습니다. 긴 글 읽어주셔서 감사합니다!

<br />

## 참고 자료

- [https://yarnpkg.com/](https://yarnpkg.com/)
- [node_modules로부터 우리를 구원해 줄 Yarn Berry](https://toss.tech/article/node-modules-and-yarn-berry)
- [yarn berry 적용기(1)](https://medium.com/wantedjobs/yarn-berry-%EC%A0%81%EC%9A%A9%EA%B8%B0-1-e4347be5987)
- [Yarn Berry, 굳이 도입해야 할까?](https://medium.com/teamo2/yarn-berry-%EA%B5%B3%EC%9D%B4-%EB%8F%84%EC%9E%85%ED%95%B4%EC%95%BC-%ED%95%A0%EA%B9%8C-d6221b9beca6)
- [npm, yarn, pnpm 비교해보기](https://yceffort.kr/2022/05/npm-vs-yarn-vs-pnpm)
