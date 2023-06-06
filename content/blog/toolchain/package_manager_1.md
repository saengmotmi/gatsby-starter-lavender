---
title: 2023-06-06 ChatGPT 시켜 패키지 매니저 만들기 (1)
date: 2023-06-06
description: 이름은 택키지매니저로 하겠습니다
tags: [패키지 매니저, javascript, npm, yarn, package manager]
thumbnail: /thumbnails/hello-world.jpg
---

나의 올해 목표는 패키지 매니저 뜯어보기였는데 이 정도 속도로는 내후년에도 어려울 것이 자명했다. 뜯어보기는 커녕 Yarn Berry 한창 뒤적거릴 때 이후로 레포지토리 입구까지도 못가봤다. 그렇게 미루다가 요즘 ChatGPT를 개인 과외 교사로 쓰고 있는데 생각해보니 아예 GPT를 부려먹으면 손 안대고 코 풀수 있겠다는 생각이 문득 들었다.

적어도 GPT4 버전 같은 경우 과거에 이미 정립된 지식 체계를 학습하는 수단으로서는 최고 수준으로 생각하고 있었기도 해서 이번 기회에 이를 검증해보고 싶었다.

<br>

## 1. ChatGPT야 패키지 매니저를 연성하렴?

GPT를 켜고(물론 4버전이다) 아래와 같이 첫 질문을 적기 시작했다. 앞으로의 방향성을 제시해야 하므로 최대한 자세히 적어주어야 할 것만 같았다(검증된 사실은 아니다).

우리의 대화는 단건으로 이어지기 보다는 전체적인 그림을 그려놓고 그 그림을 채워나가는 방식이 되어야 했다. 아래와 같은 프롬프트로 대화를 시작했다.

> Q: 나는 오늘부터 너와 대화를 통해 패키지 매니저를 바닥부터 직접 구현해보려고 해. 정말 긴 시간이 걸리겠지만 너와 대화를 하면서 하나씩 해나가다보면 언젠간 좋은 결과물을 만들 수 있을거라 믿어. 작업에 들어가기 전에 나는 2년차 비전공자 출신 프론트엔드 개발자이고 자바스크립트 툴체인에 대해 많은 관심이 있어. 내 배경을 염두에 두고 설명을 해주길 바래. 우선 우리가 만들어야 하는 프로그램의 개괄적인 설계를 먼저 그려주고, 어떻게 작업을 해나가면 좋을지 설명해줘.

아래와 같은 답변이 돌아왔다.

> 첫 번째 단계로서, 당신의 프로젝트에 대한 가장 기본적인 요구 사항을 결정해야 합니다. 어떤 종류의 패키지 매니저를 만들려고 하는지 명확하게 이해하는 것이 중요합니다. 패키지 매니저는 다양한 종류가 있기 때문입니다. 예를 들어, npm 같은 것은 자바스크립트 라이브러리를 관리하고, apt-get이나 yum 같은 것은 리눅스 배포판의 패키지를 관리합니다. 우선, 우리가 만들어야 하는 패키지 매니저의 범위를 좁혀봅시다.
>
> 가정으로, 여기서는 당신이 JavaScript 언어를 위한 패키지 매니저를 만들려고 한다고 가정하겠습니다.

> **1. 기본 설계**
>
> 패키지 매니저의 주요 구성 요소는 다음과 같습니다:
>
> - 패키지 검색 기능: 사용자가 패키지를 검색할 수 있어야 합니다.
> - 패키지 다운로드 및 설치 기능: 사용자가 선택한 패키지를 다운로드하고 설치할 수 있어야 합니다.
> - 패키지 삭제 기능: 사용자가 설치한 패키지를 삭제할 수 있어야 합니다.
> - 의존성 관리: 패키지는 종종 다른 패키지에 의존하므로 이러한 의존성을 관리할 수 있어야 합니다.

> **2. 점진적 구현**
>
> 프로젝트를 더 쉽게 관리하고 진행 상황을 쉽게 파악하기 위해 점진적으로 구현하는 것이 좋습니다. 가능한 단계는 다음과 같습니다:
>
> - 단계 1: 패키지 정보 관리
>
>   - 사용자가 검색할 수 있는 패키지 정보 저장소를 만드세요. 간단한 JSON 파일로 시작할 수 있습니다.
>
> - 단계 2: 패키지 검색 기능
>
>   - 사용자가 패키지 이름을 입력하면 정보 저장소에서 일치하는 패키지를 찾아 반환하는 기능을 만드세요.
>
> - 단계 3: 패키지 다운로드 및 설치 기능
>
>   - 패키지의 소스 코드를 다운로드하고 사용자의 로컬 시스템에 설치하는 기능을 만드세요.
>
> - 단계 4: 패키지 삭제 기능
>
>   - 사용자가 설치한 패키지를 삭제하는 기능을 만드세요.
>
> - 단계 5: 의존성 관리
>
>   - 패키지의 의존성을 다루는 기능을 만드세요. 이 기능은 패키지를 설치하거나 삭제할 때 해당 패키지의 의존성도 함께 설치하거나 삭제하도록 만듭니다.

> **3. 테스트**
>
> 각 단계를 마치고 나면 해당 기능이 제대로 작동하는지 테스트하는 것이 중요합니다. 자동화된 테스트 케이스를 작성하여 각 기능을 검증할 수 있습니다.
>
> 이 프로젝트는 분명히 어려울 수 있지만, 당신의 자바스크립트 지식과 프론트엔드 개발 경험을 바탕으로 충분히 해낼 수 있을 것이라 믿습니다. 기본적인 기능을 구현한 후에는 사용자 인터페이스를 개선하거나 추가 기능을 개발하는 등의 작업을 계속해나갈 수 있습니다. 행운을 빕니다!

<br>

위와 같은 답변을 받았다. 패키지 매니저의 개념, 핵심 기능, 구현 방법 등을 알려주는 답변이었다. 이제부터는 이 답변을 바탕으로 프로젝트를 진행해나가기에 충분할 것으로 생각했다.

그래도 패키지 매니저의 종류는 다양하므로 이 부분에 대해 좀 더 좁혀놓고 가고 싶어서 추가 질문을 했다.

> Q: > 어떤 종류의 패키지 매니저를 만들려고 하는지 명확하게 이해하는 것이 중요합니다.
>
> 너의 질문에 대한 답은 'yarn berry' 같은 패키지 매니저야. 사실 이 프로젝트에 관심을 가지게 된 계기가 yarn berry에서 제공하는 pnp와 제로 인스톨 기능 때문이거든.

<br>

아래와 같이 Yarn Berry의 특징을 설명하는 답변을 받을 수 있었다.

> 좋은 선택입니다. Yarn Berry는 많은 혁신적인 기능을 도입했으며, 그 중 Plug'n'Play (PnP)와 Zero-install이 대표적입니다. 이 두 기능에 대해 간략히 설명하겠습니다.
>
> 1. **Plug'n'Play (PnP)**: 기존의 node_modules 폴더를 없애고, 패키지의 위치를 가리키는 맵을 만드는 방식입니다. 이를 통해 중복 패키지 설치를 방지하고, 디스크 공간을 절약하며, 설치 시간을 단축할 수 있습니다.
>
> 2. **Zero-install**: 프로젝트의 종속성이 이미 패키지화되어 프로젝트와 함께 제공되기 때문에 개발자가 `yarn install`을 실행할 필요가 없습니다. 이는 빠른 프로젝트 세팅을 가능하게 합니다.
>
> 이러한 기능들을 지원하는 패키지 매니저를 만들기 위해선 기본 설계에 추가로 다음을 고려해야 합니다.
>
> 1. **패키지 위치 맵 생성**: 패키지 맵은 각 패키지의 위치를 알려주는 역할을 합니다. 패키지를 설치할 때, 패키지 위치 맵을 업데이트하는 로직을 구현해야 합니다.
>
> 2. **중복 패키지 설치 방지**: 설치를 요청한 패키지가 이미 설치되어 있는지 확인하고, 이미 설치된 경우 중복 설치를 방지하는 로직이 필요합니다.
>
> 3. **Zero-install 지원**: 패키지의 종속성을 프로젝트와 함께 패키징하여, 사용자가 별도의 설치 과정 없이 바로 프로젝트를 시작할 수 있도록 해야 합니다.
>
> 위의 기본 설계와 점진적 구현 단계에 이 기능들을 통합하는 것이 좋겠습니다. 이 프로젝트는 복잡할 수 있지만, 하나씩 천천히 구현해 나가면 분명히 성공할 수 있을 것입니다. 필요한 도움이 있으면 언제든지 물어보세요.

<br>

어차피 Yarn과 같은 기능을 구현하고 싶으므로 Yarn을 레퍼런스 삼자고 말할 거였지만(진짜 Yarn과 NPM의 차이를 반영해서 구현을 해줄거라는 기대까지는 없었지만 일단 말이라도), Yarn과 NPM의 차이에 대해 찔러두고 가고 싶어 추가 질문을 했다.

> Q: 내가 벤치마킹 할 패키지 매니저를 선정할 때 npm 을 보고 구현하는 것과 yarn을 보고 구현하는 것에 어떤 차이가 있을까?

<br>

아래와 같은 답변을 받았다.

> 먼저, NPM과 Yarn은 모두 자바스크립트의 패키지 매니저로 널리 사용되지만, 아래와 같이 중요한 차이점들이 있습니다:
>
> 1. **프로젝트의 종속성 관리**: NPM은 `package.json`과 `package-lock.json`을 사용하여 프로젝트의 종속성을 관리합니다. 반면에 Yarn은 `package.json`과 `yarn.lock` 파일을 사용합니다. 이 두 파일의 역할은 매우 유사하지만, Yarn의 경우 `yarn.lock` 파일은 패키지 간의 종속성을 더욱 정확하게 관리하므로 여러 개발 환경에서 일관성을 유지하는 데 더욱 유용합니다.
>
> 2. **성능**: 일반적으로 Yarn이 NPM에 비해 더 빠른 속도와 더 나은 성능을 제공한다고 알려져 있습니다. 이는 Yarn이 병렬로 패키지를 설치할 수 있기 때문입니다. 또한, Yarn은 종속성 설치 중 중복을 제거하여 디스크 공간을 절약합니다.
>
> 3. **추가 기능**: Yarn은 워크스페이스, Plug'n'Play (PnP), Zero-install 등과 같은 고급 기능을 제공합니다. 이러한 기능은 대형 프로젝트를 관리하거나, 디스크 공간을 절약하거나, 설치 속도를 향상시키는 데 도움이 됩니다.
>
> 이런 차이점들로 인해 NPM을 벤치마킹하여 패키지 매니저를 만들 경우, 간단하면서도 검증된 방법을 따르게 될 것입니다. 한편, Yarn을 벤치마킹하게 되면 좀 더 복잡하지만 혁신적인 기능을 구현하게 될 것입니다.
>
> 따라서 벤치마킹을 선택할 때는 당신이 어떤 기능을 구현하고 싶고, 얼마나 복잡한 프로젝트를 원하는지에 따라 결정해야 합니다.

<br>

## 2. 초기 세팅

이제 빌드업은 충분하고 직접적으로 구현을 시작해볼 차례다. 우선 GPT가 일러주는 대로 기본적인 초기 세팅을 한다.

1. 프로젝트 폴더 생성

```bash
> mkdir my-package-manager
> cd my-package-manager
```

<br>

2. Node.js 초기화

```bash
> npm init
```

3. Git 초기화

```bash
> git init
```

4. .gitignore 파일 생성

```bash
> echo "node_modules/" >> .gitignore
```

그리고 GPT가 초기세팅 말미에 테스트 코드도 중요하다는 말을 하길래 중요한 기능을 구현할 때마다 적당한 테스트 코드를 덧붙여달라고 했다.

> Q: 나는 이 프로젝트가 기본적으로 최소한의 기능을 먼저 구현하고 그 구현의 완료가 테스트 코드로 확인되었으면 좋겠어. 네가 알려준대로 처음엔 패키지 검색 기능부터 시작하려고 해. 코드로 보여줄래?

GPT가 `node-fetch`와 `jest` 설치를 권유하여 그대로 설치해주었다. Node.js 18 버전에서 fetch API가 추가되었으나 아직 Experimental이므로 패키지를 설치하는 쪽으로 선택했다.

```
> yarn add node-fetch
> yarn add -D jest
```

다만 `node-fetch`는 ESM을 기반으로 작성되어 CJS 기반인 jest에서 그대로 실행하면 터진다. 그래서 CJS 환경에 맞출까 ESM으로 갈까 고민하다가 그냥 ESM으로 가기로 했다.

`package.json` 에서 `type`을 `module`로 바꾸고, test 스크립트는 아래와 같이 작성했다. Jest 공식 문서에 나와 있다(https://jestjs.io/docs/ecmascript-modules). 그러면 별도 패키지 설치 필요 없이 잘 돌아간다.

```json
"scripts": {
  "test": "yarn node --experimental-vm-modules $(yarn bin jest)"
},
```

여담으로 이거 이슈 찾아보다가 node-fetch가 ESM으로 넘어갔다가 불판이 벌어진 걸 봤는데 개발자들 참 살벌하다는 생각이 들었다...

<br>

## 3. 검색 기능 구현 & 테스트 코드 추가

환경 세팅은 되었으니 이제 본격적으로 기능을 추가해보도록 하자. GPT가 일러준 대로 검색 기능부터 구현하자.

```js
import fetch from "node-fetch";

async function searchPackages(packageName) {
  const response = await fetch(
    `https://registry.npmjs.org/-/v1/search?text=${packageName}`
  );
  const data = await response.json();

  return data.objects.map((obj) => obj.package);
}

export default searchPackages;
```

놀랍게도 그냥 npm 레지스트리에서 제공하는 주소에 패키지 이름을 쿼리스트링으로 제공하기만 하면 JSON 타입의 응답이 오는걸 가지고 활용하는 거였다. 이 API에 대한 설명은 여기(https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search) 에서 확인할 수 있다.

이제 GPT가 만들어준 테스트 코드를 추가해보자. 근데 함수가 진짜로 API 호출하는 거다보니 테스트 코드가 깨질 위험성이 있어서 좋진 않은거 같다. 이건 추가로 GPT 한테 따져보기로 하고 일단은 그대로 추가해보자.

```js
import searchPackages from "../src/searchPackages.js";

test("should return packages related to the search term", async () => {
  const packages = await searchPackages("express");

  // 검색 결과에 express 패키지가 포함되어 있는지 확인합니다.
  const expressPackage = packages.find((pkg) => pkg.name === "express");
  expect(expressPackage).toBeTruthy();
});
```

근데 타입스크립트도 갑자기 쓰고 싶어서 세팅을 하려고 했는데... cli랑 jest랑 esm이랑 모두 합쳐져 어질어질 해져서 포기하기로 했다. 자꾸 살 붙이지 말고 일단 쭉 가보자.

점진적으로 구현하기로 했으므로 일단은 검색 기능을 cli로 제공해보자.

```ts
// index.js
import searchPackages from "./src/searchPackages";

const args = process.argv.slice(2);
const searchQuery = args[0];

searchPackages(searchQuery)
  .then((packages) => {
    for (const pkg of packages) {
      console.log(pkg.name);
    }
  })
  .catch((error) => {
    console.error(`Error while searching for packages: ${error.message}`);
  });
```

cli 기능에 대한 테스트 코드를 GPT가 만들어주긴 했지만 몇 가지 문제가 있어 넘어간다.

- `require("../index.js")` 와 같은 방식으로 cli를 실행하고 있는데 이렇게 하면 내부에서 실행되는 searchPackages 함수가 실제로 API를 호출하고, 그 결과를 현재 코드로는 받아볼 방법이 없어서 테스트가 깨진다.

- `searchPackages` 함수에 대한 단위 테스트는 이미 존재하고, 위 테스트 코드에서 그 부분을 배제한다면 사실상 표준입출력에 대한 테스트 코드가 되므로 의미가 없다고 판단했다.

<br>

## 4. 패키지 다운로드 기능 추가

패키지를 다운로드 하는 기능은 `tar`를 사용해야 하므로 설치해주자.

```bash
> yarn add tar
```

src 경로 이하에 `installPackage.js` 파일을 생성하고 아래와 같이 작성한다.

```js
import fetch from "node-fetch";
import tar from "tar";
import fs from "fs";
import path from "path";

async function installPackage(packageName) {
  const response = await fetch(`https://registry.npmjs.org/${packageName}`);
  const data = await response.json();

  const tarballUrl = data.versions[data["dist-tags"].latest].dist.tarball;

  const responseTarball = await fetch(tarballUrl);
  if (!responseTarball.ok) {
    throw new Error(`Failed to fetch tarball for package: ${packageName}`);
  }

  // Ensure node_modules/test-package directory exists
  const packageDir = path.join("node_modules", packageName);
  if (!fs.existsSync(packageDir)) {
    fs.mkdirSync(packageDir, { recursive: true });
  }

  // Extract package to node_modules/test-package
  await new Promise((resolve, reject) => {
    const extract = tar.x({
      C: packageDir,
      strip: 1, // Strip package top-level directory
      onfinish: resolve,
      onerror: reject,
    });

    responseTarball.body.pipe(extract);
  });
}

export default installPackage;
```

cli 쪽 코드는 아래와 같이 수정한다. 다른 폴더로 이동해서 `node ../taekage-manager install express` 와 같이 실행해보면 `node_modules`가 생성되며 해당 폴더에 `express` 패키지가 설치된 것을 확인할 수 있다.

```js
const searchPackages = require("./searchPackages");
const installPackage = require("./installPackage");

const [command, packageName] = process.argv.slice(2);

if (command === "search") {
  searchPackages(packageName)
    .then((packages) => {
      for (const pkg of packages) {
        console.log(pkg.name);
      }
    })
    .catch((error) => {
      console.error(`Error while searching for packages: ${error.message}`);
    });
} else if (command === "install") {
  installPackage(packageName)
    .then(() => {
      console.log(`Successfully installed ${packageName}`);
    })
    .catch((error) => {
      console.error(`Error while installing package: ${error.message}`);
    });
} else {
  console.log('Invalid command. Please use "search" or "install".');
}
```

근데 설치 성공해도 console이 출력되지 않는데, 이건 GPT가 잘못된 코드를 출력했기 때문이다. Promise 쪽을 아래와 같이 고치자.

```js
await new Promise((resolve, reject) => {
  const extract = tar
    .x({
      C: outputPath,
      strip: 1, // Strip package top-level directory
    })
    .on("finish", () => {
      console.log(`Successfully installed ${outputPath}`);
      resolve();
    })
    .on("error", (error) => {
      console.log(`Failed to install ${outputPath}: ${error}`);
      reject(error);
    });

  responseTarball.body.pipe(extract);
});
```

이 함수에 대해서도 테스트 코드가 있었는데... GPT가 만들어준 테스트 코드는 좋은 테스트 코드가 아닌것 같았고, ESM과 섞이면서 계속 에러를 내는 와중에 내가 테스트를 잘 몰라서 일단 접어두기로 했다. 이렇게 다들 테스트를 포기하나 보다...

<br>

## 5. 패키지 삭제 기능 추가

삭제 기능도 마찬가지로 `uninstallPackage.js` 파일을 생성하고 아래와 같이 작성한다.

```js
import fs from "fs";
import path from "path";

function uninstallPackage(packageName) {
  const packageDir = path.join("node_modules", packageName);

  if (!fs.existsSync(packageDir)) {
    throw new Error(
      `Cannot uninstall ${packageName}, package is not installed`
    );
  }

  fs.rmSync(packageDir, { recursive: true, force: true });

  console.log(`Successfully uninstalled ${packageName}`);
}

export default uninstallPackage;
```

cli 쪽에는 아래와 같이 추가해준다.

```js
// ... 기존 코드는 생략 ...
} else if (command === 'uninstall') {
  try {
    uninstallPackage(packageName);
    console.log(`Successfully uninstalled ${packageName}`);
  } catch (error) {
    console.error(`Error while uninstalling package: ${error.message}`);
  }
} else {
  console.log('Invalid command. Please use "search", "install", or "uninstall".');
}
```

삭제도 잘 된다.

어느 정도 기능들이 추가 되면서 구조를 갖출 필요를 느끼던 차에 GPT가 직전 문답 말미에 리팩토링에 대한 언급을 먼저 해주었고 어떤 구조로 리팩토링을 할지에 대한 의견을 받아보았다. 대답은 아래와 같았고 일단 제안대로 가보기로 했다.

```bash
/my-package-manager
|-- /commands
|   |-- search.js
|   |-- install.js
|   |-- uninstall.js
|-- /utils
|   |-- downloadPackage.js
|   |-- extractTarball.js
|-- /tests
|   |-- search.test.js
|   |-- install.test.js
|   |-- uninstall.test.js
|-- index.js
```

installPackage.js 내부에 있던 기능들을 각각 분리해셔 utils로 옮기고, 나머지 파일들을 폴더 구조에 맞게 옮겨주는 것으로 리팩토링을 마무리했다.

다음은 의존성 관리 기능을 추가해야 하는데 글이 너무 길어져서 일단 여기서 한번 끊고 가야겠다.

일단 여기까지 느낀 점을 정리해둔다.

- ESM에서는 import 경로 끝에 확장자를 추가해줘야 한다. 파일을 검색할 때 확장자를 붙여야 검색이 효율적이기 때문에 ESM 환경에서는 이를 강제하고 있다고 한다.

- CJS 기반의 프로젝트와 ESM 환경을 섞어 쓰는 것은 재앙이다. 프론트엔드 쪽은 그렇다 치는데 Node.js 환경에서, 특히 `ts-node` 나 `jest` 같은 걸 쓰게 되면 한발짝 뗄떼마다 구글링을 해야 한다. 타입스크립트 까지 쓰려다가 포기한 이유이기도 하다. 특히, jest는 런타임에 손대는 동작들이 있어서 그런지 동기 / 비동기 문제가 많이 발생하는거 같았다. 요기(https://youtu.be/mee1QbvaO10?t=1663) 확인하면 해당 내용에 대한 언급이 있다.

- GPT가 생성해준 코드를 그대로 돌릴 수 있던 적도 있었지만, 그렇지 않은 적도 있었고 인터페이스 자체를 틀리게 알려준 경우도 있었다. 그런데 재밌는 사실은 에러 메시지와 함께 원본 코드를 제공해주면 올바른 코드를 알려주었다.

- GPT가 생성해준 테스트 코드는 좋은 테스트 코드가 아니었다. 내가 프롬프트를 잘못 작성했을 수도 있지만 설치, 검색 등 외부 세계와 소통하는 코드에 대한 테스트를 작성할 때 적절히 mocking을 해주지 않아 실제 사이드 이펙트를 발생시키고 그걸 정말 체크하는 방식이라 그냥 넋놓고 쓸 수는 없었다.

지금까지 작성한 코드는 Github 레포지토리(https://github.com/saengmotmi/taekage-manager) 에서 확인할 수 있다. 삽질한 시간이 생각보다 길어서 아직까지는 생각보다 별 코드가 없다....
