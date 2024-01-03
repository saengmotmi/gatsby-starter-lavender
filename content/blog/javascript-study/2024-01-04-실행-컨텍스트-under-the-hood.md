---
title: 2024-01-04 코드로 구현해보는 실행 컨텍스트
date: 2024-01-04
description: "꼭 이렇게까지... 해야겠어...?"
tags: [JavaScript]
thumbnail: /thumbnails/hello-world.jpg
---

> 주의: 이 글은 2023-08-06을 기준으로 작성되었으며, 약간의 윤문을 거쳐 최근 발행되었습니다. GPT에 의존한 글로 오류가 있을 수 있습니다.

## 1. 실행 컨택스트, 낯짝 좀 보자

github을 뒤적거리며 실제 동작을 보고 Next.js를 이해하던 어느 날... 이런 생각을 했던 것 같다. 다른 코드들은 다 까볼 수 있는데 `실행 컨텍스트`는 왜 맨날 책에서 나온 문장으로만 봐야 하지? 실행 컨텍스트도 어차피 자바스크립트 엔진에 의해서 실행되는 코드 아니야?

하지만 나는 아직 V8을 까볼 만큼의 용기(몇 번 들여다보긴 했다)도, C++에 대한 지식도 없는 상황이었기에 꿩 대신 닭으로 자바스크립트를 가지고 구현을 모방해가며 이해해보기로 했다.

아래 함수의 구현은 매우 매우 간단하다. 이제부터 이 함수의 실행 컨텍스트를 흉내내보려 한다.

```jsx
const foo = () => {
  var a = 1;
  let b = 2;

  const c = () => {
    const d = "d";
    return "e";
  };
};
```

구현의 난이도를 떠나서 애초에 모든 프로그래밍 언어들은 그 자체로는 그저 문자열들이 모여 만들어진 텍스트 자료(`.js`)일 뿐이다.

처음 대답처럼 분명 저 코드는 `자바스크립트 엔진`이 돌린다. 우리가 흔히 V8 엔진이라고 부르는 그것 말이다. 더 먼 훗날에는 좀 더 자세히 설명할지도 모르겠지만 일단 지금 시점에서 알고 있는 지식 몇 가지를 먼저 늘어놔보자.

- 자바스크립트 코드는 자바스크립트 엔진을 통해 `평가(Evaluation)` 단계와 `실행(Execution)` 두 단계를 거쳐 동작하게 된다.

- `평가 단계`에서는 자바스크립트 엔진이 코드를 해석하며, 필요한 변수 및 함수 선언을 찾고 메모리에 할당한다. 이때, 실행 컨텍스트의 `LexicalEnvironment`가 생성되며, 변수들은 선언 단계에서 `TDZ(Temporal Dead Zone)`에 있게 되고, `함수 선언은 초기화`가 완료되어 사용할 수 있는 상태가 된다.

- `실행 단계`에서는 실제 코드의 계산, 할당, 조건문 실행, 함수 호출 등이 이루어진다. 이때, 실행 컨텍스트의 `변수들이 초기화`되며 TDZ를 빠져나오게 된다.

하지만 위 설명만 보고 ‘음, 실행 컨텍스트는 평가 단계에서 생성되는군’ 이라고 마냥 착각하면 안된다. 실행 컨텍스트는 세 가지 상황에서 생성되기 때문이다.

1. **전역 코드 평가**: JavaScript 엔진이 `스크립트를 처음 실행할 때`, `전역 실행 컨텍스트`가 생성된다. 이 컨텍스트는 변수와 함수 선언, this 바인딩 등 전역 범위의 정보를 포함하며, 스크립트 실행 동안 유지된다.

2. **함수 호출**: `함수가 호출될 때마다` 해당 `함수의 실행 컨텍스트`가 생성된다. 이 컨텍스트는 함수 내부의 변수와 함수 선언, this 바인딩, arguments 객체 등을 포함한다. 함수 호출이 끝나면 해당 실행 컨텍스트는 콜 스택에서 제거된다.

3. **eval 호출**: eval 함수가 호출될 때마다 새로운 실행 컨텍스트가 생성된다. 이 컨텍스트는 eval에 의해 실행되는 코드의 변수와 함수 선언 등을 포함한다. eval 호출이 끝나면 해당 실행 컨텍스트는 제거된다.

여기서 eval 호출의 경우 예외 케이스로 볼 수 있으므로 1, 2에 대해서만 다뤄도 좋겠다.

이 두 가지 케이스에 대해 서두에 주어진 예시 코드를 실행 컨텍스트의 구현을 좀 더 드러낼 수 있는 형태로 변형해보자. 물론 구현은 GPT한테 만들어달라고 했고, 대략적인 느낌만 살펴봐도 좋겠다.

```jsx
// Environment Record를 표현하는 객체
let globalEnvironmentRecord = {
  outer: null,
  bindings: {},
};

// 전역 LexicalEnvironment
let globalLexicalEnvironment = {
  environmentRecord: globalEnvironmentRecord,
  outer: null,
};

// 변수 선언 시 LexicalEnvironment에 바인딩 생성
function variableDeclaration(name, environment) {
  environment.environmentRecord.bindings[name] = undefined;
}

// 변수에 값을 할당하는 함수
function assignment(name, value, environment) {
  environment.environmentRecord.bindings[name] = value;
}

// 함수 선언 시 새로운 함수 객체 생성
function functionDeclaration(name, func, environment) {
  environment.environmentRecord.bindings[name] = func;

  // 함수 객체에 [[Environment]] 슬롯 설정
  func["[[Environment]]"] = environment;
}

// 함수를 호출하는 함수
function functionInvocation(func, environment) {
  // 새로운 LexicalEnvironment 생성
  let newLexicalEnvironment = {
    environmentRecord: {},
    outer: func["[[Environment]]"],
  };

  // 여기서 함수 코드를 실행하면 됩니다
}

// 전역 코드 실행 (TDZ 구현이 없는 버전임)
functionDeclaration(
  "foo",
  function () {
    variableDeclaration("a", foo["[[Environment]]"]);
    assignment("a", 1, foo["[[Environment]]"]);

    variableDeclaration("b", foo["[[Environment]]"]);
    assignment("b", 2, foo["[[Environment]]"]);

    functionDeclaration(
      "c",
      function () {
        variableDeclaration("d", c["[[Environment]]"]);
        assignment("d", "d", c["[[Environment]]"]);

        return "e";
      },
      foo["[[Environment]]"]
    );
  },
  globalLexicalEnvironment
);
```

이 구현을 기반으로 명세를 함께 살펴보며 실행 컨텍스트에 대해 좀 더 자세히 알아보자.

## 2. 명세를 살펴봅시다

### 2-1. Variable Environment와 Lexical Environment

ECMAScript 스펙(https://tc39.es/ecma262/#sec-execution-contexts) 에 따르면, 각 실행 컨텍스트는 `VariableEnvironment`와 `LexicalEnvironment`라는 두 가지 `환경 컴포넌트(Environment Component)`를 가지고 있다. (명세이므로 당연히 실제 동작에 대한 내용은 없다. 명세는 스펙만 선언하고, 실제 구현은 각 엔진 제조사들이 담당한다.)

두 환경 컴포넌트들의 특징은 아래와 같다.

1. **Variable Environment** : 이 환경은 주로 `var` 키워드로 선언된 변수와 함수 선언을 처리한다. 호이스팅이 적용되어 선언들이 해당 스코프의 최상단으로 올라간다. 초기화는 원래 코드에서 선언된 위치에서 이루어진다. 따라서, 선언 전에 변수를 참조하면 `undefined`가 반환된다.

2. **Lexical Environment** : 이 환경은 `let`, `const` 키워드로 선언된 변수와 `class` 선언을 처리한다. 이들 선언은 호이스팅되지 않다. 실제로는 호이스팅되지만, 선언 전에 참조하려하면 `ReferenceError`가 발생하도록 TDZ가 적용된다. 이는 변수와 클래스가 선언된 위치에서 초기화되어야 함을 보장한다.

참고로 `VariableEnvironment`는 코드 실행에 필요한 변수에 대한 정보를 담고 있으며, 기본적으로 `LexicalEnvironment의 초기 상태의 스냅샷`이라고 보면 된다.

즉, **코드 실행 시 변수에 대한 변경 사항은 LexicalEnvironment에 반영**되지만 **VariableEnvironment는 변경되지 않는다**.

왜 그래야 할까? ECMAScript 명세에서는 VariableEnvironment를 **코드 실행에 대한 환경의 레코드**로 기술한다. 본질적으로, VariableEnvironment는 `호이스팅(hoisting)된 변수와 함수 선언에 대한 초기 환경 스냅샷`을 유지한다. 따라서 이는 해당 실행 컨텍스트가 처음 생성될 때의 상태를 "기억"하는 역할을 한다는 뜻이다.

LexicalEnvironment는 실행 시간 동안 업데이트 될 수 있는 반면, VariableEnvironment는 실행 컨텍스트가 생성될 때 설정되고, 이후로는 변경되지 않는다. 자바스크립트 엔진은 코드 실행 중에 이전 상태를 참조할 수 있게 되며, 이는 디버깅과 오류 처리 등의 과정에서 유용하게 사용될 수 있을 것이다.

여기까지 알아보기는 했지만 사실 VariableEnvironment에 대해 대단히 깊게 생각할 필요는 없을지도 모른다. 애초에 자바스크립트 창시자인 브랜든 아이크는 [이렇게](https://twitter.com/BrendanEich/status/522395336615428097) 말했다.

> Q: Why does Javascript do hoisting? Why was the language designed that way? What was the inspiration for such a design?
>
> (자바스크립트가 호이스팅을 하는 이유는 무엇인가요? 언어가 그렇게 설계된 이유는 무엇일까요? 그런 설계의 영감은 무엇이었나요?)
>
> A: function hoisting allows top-down program decomposition, 'let rec' for free, call before declare; var hoisting tagged along. var hoisting was thus unintended consequence of function hoisting, no block scope, JS as a 1995 rush job. ES6 'let' may help.
>
> (함수 호이스팅을 사용하면 하향식 프로그램 분해가 가능하고, 'let rec'를 저절로 사용하고 선언 전에 호출하며, var 호이스팅에 태그를 붙일 수 있습니다. var 호이스팅은 블록 범위가 없는 함수 호이스팅, 1995년 당시의 급한 작업이었던 JS의 의도하지 않은 결과였습니다. ES6 'let'이 도움이 될 수 있습니다.)

### 2-2. Environment Record와 Outer Environment Reference

각각의 환경은 다시 `Environment Record`와 `Outer Environment Reference`라는 두 가지 컴포넌트로 구성된다.

- **Environment Record**는 변수와 함수 선언에 대한 정보를 저장하며, 이를 통해 식별자와 그 식별자가 참조하는 값 사이의 매핑(key - value)을 유지한다.

- **Outer Environment Reference**는 외부(또는 부모) 스코프를 참조하며, 이를 통해 스코프 체인이 형성된다.

함수가 선언될 때, 그 함수의 `[[Environment]]` 내부 슬롯은 그 시점의 LexicalEnvironment를 참조한다. 즉, 그 시점의 Environment Record와 Outer Environment Reference를 참조하게 된다.

함수가 실행될 때, 새로운 LexicalEnvironment가 생성된다. 이 새로운 LexicalEnvironment의 `Environment Record`(key - value 쌍)는 실행되는 함수의 로컬 변수를 저장하고, `Outer Environment Reference`는 함수가 선언될 때 참조하게 된 `[[Environment]]`를 가리킨다. 이로 인해, 함수 내부에서는 함수 외부의 변수에 접근이 가능하게 되는 것이다. ← **이 부분이 완전 밑줄 쫙**이다

따라서 **그 시점의 환경 레코드**라는 것은 함수가 선언될 때의 Environment Record와 Outer Environment Reference, 즉 그 시점의 LexicalEnvironment를 의미하는 것이다.

좀 더 쉬운 말로 풀어보자.

- 함수가 실행되었을 때 해당 함수의 `[[Environment]] 슬롯`을 참조하여 VariableEnvironment와 LexicalEnvironment가 함께 생성된다. 이 둘이 뭔가 용도가 비슷해보여서 헷갈릴 수 있는데, TDZ 적용 여부에 따라 구분하면 대략 맞다.

- 그리고 LexicalEnvironment는 위 설명에서도 나오듯, 클로저 생성시에 새로 생성되는 함수 객체의 [[Environment]]에 활용되고 참조 가능해진다. 그렇기 때문에 이전 스코프에서의 실행 환경을 기억할 수 있는 것이다.

TDZ까지 반영한 실행 컨텍스트의 구현은 아래와 같다.

```jsx
// Environment Record를 표현하는 객체
let globalEnvironmentRecord = {
  outer: null,
  bindings: {},
};

// 전역 LexicalEnvironment
let globalLexicalEnvironment = {
  environmentRecord: globalEnvironmentRecord,
  outer: null,
};

// 변수 선언 시 LexicalEnvironment에 바인딩 생성
function variableDeclaration(name, environment) {
  if (environment.environmentRecord.bindings[name]) {
    throw new Error(`'${name}'이(가) 이미 선언되었습니다`);
  }
  // TDZ 시작 (tdz: true)
  environment.environmentRecord.bindings[name] = {
    value: undefined,
    tdz: true,
  };
}

// 변수에 값을 할당하는 함수
function assignment(name, value, environment) {
  if (environment.environmentRecord.bindings[name]?.tdz) {
    throw new Error(`Cannot access '${name}' before initialization`);
  }
  environment.environmentRecord.bindings[name] = { value: value, tdz: false }; // 할당 완료 시 TDZ 종료 (tdz: false)
}

// 함수 선언 시 새로운 함수 객체 생성
function functionDeclaration(name, func, environment) {
  environment.environmentRecord.bindings[name] = { value: func, tdz: false }; // 함수 선언 완료 시 TDZ 종료 (tdz: false)
  // 함수 객체에 [[Environment]] 슬롯 설정
  func["[[Environment]]"] = environment;
}

// 함수를 호출하는 함수
function functionInvocation(func, environment) {
  // 새로운 LexicalEnvironment 생성
  let newLexicalEnvironment = {
    environmentRecord: {},
    outer: func["[[Environment]]"],
  };

  // 여기서 함수 코드를 실행하면 됩니다
}

// 전역 코드 실행 (TDZ 구현 버전)
functionDeclaration(
  "foo",
  function () {
    variableDeclaration("a", foo["[[Environment]]"]);
    // TDZ 체크
    assignment("a", 1, foo["[[Environment]]"]);

    variableDeclaration("b", foo["[[Environment]]"]);
    // TDZ 체크
    assignment("b", 2, foo["[[Environment]]"]);

    functionDeclaration(
      "c",
      function () {
        variableDeclaration("d", c["[[Environment]]"]);
        // TDZ 체크
        assignment("d", "d", c["[[Environment]]"]);

        return "e";
      },
      foo["[[Environment]]"]
    );
  },
  globalLexicalEnvironment
);
```

## 3. 그래도 아쉬우니 V8 조금 들여다보기

오늘 살펴봤던 내용들이랑 가장 가까운 파일은 `src/parsing/preparser.cc`([링크](https://github.com/v8/v8/blob/90fd8c27e751ca18e3831afa4fb1846f0ec19e4e/src/parsing/preparser.cc)) 일 것이다. 컴파일러 스터디 찔끔 했다고 대강 뭐가 어디 있을지 예측력이 늘었다...

아무튼 이 코드는 V8 JavaScript 엔진 내부의 `PreParser` 클래스에 대한 것으로, JavaScript 코드의 사전 파싱(pre-parsing) 과정을 처리한다. 사전 파싱은 JavaScript 프로그램을 검사하고, 나중에 파싱을 빠르게 수행할 수 있도록 돕는 preparse 데이터를 생성하는 과정으로 아마 이 부분이 일반적으로 '평가'와 '실행' 중 전자인 '평가'에 해당하는 부분이 아닐까 싶다.

코드의 주요 부분을 살펴보면 다음과 같다.

1. `PreParserFormalParameters::ValidateDuplicate` 및 `ValidateStrictMode` 메소드

   - 함수의 매개변수에 대한 검증을 함.

   - 중복 매개변수나 엄격 모드(strict mode)에서의 문제가 있을 경우, `preparser->ReportUnidentifiableError()`를 호출하여 오류를 리포트함.

2. `PreParser::PreParseFunction` 메소드

   - 함수의 이름, 종류, 문법 종류, 스코프 등을 인자로 받아 함수를 사전 파싱함.

   - 함수 리터럴 ID를 초기화하고, 함수의 매개변수와 본문을 파싱함.

   - 스코프와 관련된 처리, 오류 검사 및 언어 모드 설정 등도 이루어짐.

3. `PreParser::ParseFunctionLiteral` 메소드

   - 함수 이름, 위치, 유효성, 종류 등의 정보를 기반으로 함수를 사전 파싱함.

   - 매개변수 목록 파싱, 함수 본문 파싱, 이름 및 매개변수 검증 등이 이루어짐.

4. `PreParser::ParseStatementListAndLogFunction` 및 `BuildParameterInitializationBlock` 메소드

   - 명령문 목록을 파싱하고, 초기화 블록을 구축하는 역할을 함.

사실 이렇게 본다고 해서 크게 도움이 되는 것 같진 않지만, 또 뭐가 어디서 걸릴지 모르는거 아니겠나 싶기도 하다. 언젠간 뭐라도 되겠지...? V8 코드가 술술 읽히고 컴파일러를 정복하는 그 날이 올 때까지 삽질은 계속된다 쭈욱...
