---
title: 2023-10-05 우리는 정말 프론트엔드 '엔지니어'일까?
date: 2023-10-05
description: 전혀 스윙... 아니, 엔지니어링을 하고 있지 않아...?
tags: [Article]
thumbnail: /thumbnails/hello-world.jpg
---

## 프론트엔드에서 구조를 추구하면 안 되는 걸까?

몇 달째 제 머릿속을 꽉 사로잡고 있는 주제는 ‘프론트엔드에서 구조를 추구하면 안 되는 걸까?' 입니다. 문장만 놓고 보면 프로그래머가 구조를 추구하는 게 잘못된 일이라는, 애초에 성립하지도 않는 이상한 문장인 것만 같습니다. 동의할 사람도 많지 않을듯 하고요.

하지만 유독 웹 프론트엔드 분야에서는 어플리케이션이 어떠한 구조를 갖추어야 한다는 강한 컨센서스를 경험해본 적이 없는 것 같습니다. 실제로 Angular나 Remix 같은 프레임워크 정도를 제외하면 어떤 구조로 개발하라는 언급 자체가 거의 없는 편입니다. 자유로운 걸 수도 있지만, 저는 방임에 가깝다고 보고 있고 사실 이건 역사가 짧은 기술들이 겪는 열병 같은거라고 생각합니다. [SwiftUI + MVVM에 대한 고찰](https://velog.io/@flamozzi/SwiftUI-MVVM%EC%9D%98-%EB%8C%80%ED%95%9C-%EA%B3%A0%EC%B0%B0) 같은 글을 보면 SwiftUI에서 MVVM을 쓸 필요가 있냐는 비판이 존재함을 볼 수 있습니다.

이는 구조 자체에 대한 비판이라고 보기는 어렵고, 오히려 비즈니스 로직 분리에 대한 필요성은 인정하고 있죠. React는 근본적으로 UI Renderer로서 '라이브러리'를 표방(엄밀히 따지면 얘기가 조금 복잡해지지만요)하고 있습니다. 비즈니스 로직을 적절히 여러 계층으로 나누어 관리하는 건 라이브러리의 관심사가 아닙니다. 오히려 프레임워크에 가깝죠. 그리고 프레임워크에서도 쉽사리 일괄적으로 강제하기 어렵습니다. 회사마다 비즈니스적 특징도 각각 너무 다르고요.

다시 ‘프론트엔드에서 구조를 추구하면 안 되는 걸까?' 라는 원래 질문으로 돌아와보겠습니다. 대체로는 맞는 말이지만, 어쩐지 제한부로만 허락되는 문장처럼 느껴집니다. 이유를 곰곰히 생각해보니 ‘구조를 추구하는 것은 경제적으로 비효율적’ 이라는 반박이 떠오르네요. 비용 효율성이라니. 충분히 논박의 여지가 있어보입니다.

하지만 그 심층에는 단순히 '비용 효율성’으로 퉁치기 어려운 여러 부담감들이 숨어있다고 생각합니다. 이 질문들에 대한 답을 당장 내리지는 못하겠지만 늘어놓는 것 만으로도 일단 의미가 있다고 생각하므로 일단 적어보겠습니다.

- UI는 자주 변경되므로 구조를 적용하는 것은 오버 엔지니어링일 수 있다.

- 프레임워크 레벨에서 코드를 강제하는 규칙이 없으므로, 제대로 준수되지 않을 규칙이라면 의미가 없다.

- OOP(로 대변되는 어떠한 방법론들)는 백엔드 개발자들이 쓰는 것이고, 함수 중심인 프론트엔드에는 적절치 않다.

- …

## 1년 반 만의 '클린 아키텍처' 재방문

이런 저런 고민을 안고 있던 와중 연휴를 맞아 약간의 기대감을 가지고 예전에 읽었던 <클린 아키텍처>를 다시 펼쳐들게 됐습니다. 22년 5월에 스터디를 했으니 대략 1년 반만의 재방문이었네요. 그때는 너무 추상적이고 어려운 말들만 있어서 읽는게 쉽지 않았는데, 지금 시점에서 다시 보니 상당히 실전적인 책이라는 생각이 들었습니다. 그리고 제가 생각한 ‘구조’는 너무 특정 패턴을 구현할 것인지 말 것인지 처럼 너무 좁은 의미로서의 정의 아니었나 싶기도 하고요.

아래 문장을 읽으면서는 우리가 기술적으로 챌린지 해야 할 영역을 재정의해야 하는 것이 아닌가 반성이 되었습니다. 특히 언제나 바쁘게 일하면서도 그러한 노력들이 그저 흩어져 사라질 ‘분주함’에 그치지 않도록 경계해야 했는데, 그렇지 못했다는 생각을 했습니다.

> 프로그램이 동작하도록 만드는 데 엄청난 수준의 지식과 기술이 필요하지는 않다. 언제든 어린 고등학생이라도 할 수 있는 일이다. (...) 전 세계의 수많은 초급 프로그래머가 칸막이로 나뉜 작은 사무실에서 이슈 추적 시스템에 등록된 거대한 요구사항 문서들을 순전히 강인한 정신력만으로 힘겹게 해결해 내면서 시스템을 '동작'하도록 만든다. 이들이 작성한 코드는 그다지 깔끔하지 않을 순 있지만, 동작은 한다. 프로그램을 동작하게 만들기는 그리 어려운 일이 아니기 때문이다. - 2p

> 당신이 만든 시스템은 서로 강하게 연관되어 있고 복잡하게 결합되어서, 아주 사소한 변경에도 몇 주가 걸릴 뿐만 아니라 큰 위험을 감수해야 하지는 않았나? 잘못된 코드와 끔찍한 설계로 인해 방해를 받지 않았나? 시스템의 설계가 팀의 사기를 떨어뜨리거나 고객의 신뢰를 잃고 관리자의 인내심을 시험하는 부정적인 영향을 끼치지는 않았나? - 3p

> 유지보수의 가장 큰 비용은 탐사(spelunking)와 이로 인한 위험부담에 있다. 탐사란 기존 소프트웨어에 새로운 기능을 추가하거나 결함을 수정할 때, 소프트웨어를 파헤쳐서 어디를 고치는 게 최선인지, 그리고 어떤 전략을 쓰는 게 최적일지를 결정할 때 드는 비용이다. 이러한 변경사항을 반영할 때 의도치 않은 결함이 발생할 가능성은 항상 존재하며, 이로 인한 위험부담 비용이 추가된다. 주의를 기울여 신중하게 아키텍처를 만들면 이 비용을 크게 줄일 수 있다. 시스템을 컴포넌트로 분리하고, 안정된 인터페이스를 두어 서로 격리한다. - 146p

그리고 특히 제가 어떤 수준에서든(코드 레벨에서든 인프라스트럭쳐 레벨에서든) 프로젝트에 ‘구조’를 추구해야겠다는 생각을 하게 된 문장은 다음과 같습니다.

> 이러한 책임을 다하려면 싸움판에 뛰어들어야 하며, 더 정확히는 '투쟁'해야 한다. (…) 효율적인 소프트웨어 개발팀은 뻔뻔함을 무릅쓰고 다른 이해관계자들과 동등하게 논쟁한다. 소프트웨어 개발자인 당신도 이해관계자임을 명심하라. 당신은 소프트웨어를 안전하게 보호해야 할 책임이 있으므로 당신 역시도 이해관계가 있다. 이것이 바로 당신의 역할 중 하나이며, 당신의 책무 중 하나다. 또한 이것이바로 당신이 고용된 중요한 이유 중 하나이기도 하다. - 20p

> 하나만 기억하자. 아키텍처가 후순위가 되면 시스템을 개발하는 비용이 더 많이 들고, 일부 또는 전체 시스템에 변경을 가하는 일이 현실적으로 불가능해진다. 이러한 상황이 발생하도록 용납했다면, 이는 결국 소프트웨어 개발팀이 스스로 옳다고 믿는 가치를 위해 충분히 투쟁하지 않았다는 뜻이다. - 21p

어쩌면 다소 거칠고 도발적일 수 있는 여지가 있는 문장입니다. 하지만 항상 코드를 고치기 어렵기 때문에 개발 기간을 더 길게 잡아야 한다는 변명에 안주하지 않았냐고 물었을 때, 떳떳하지 못한 것도 사실입니다. 제품이 점차 수정하기 어려워질 때 엔지니어로서 제품의 내구도를 점검하고 비즈니스 조직에 에스컬레이션을 할 책임이 분명 있었으나 진정으로 제품을 책임지기 위한 최선의 행동을 충분히 취하지는 못했습니다.

## 좋은 엔지니어는 '문제'를 능동적으로 해결한다

저는 엔지니어란 기술로 문제를 해결해야 하는 사람이어야 한다고 생각합니다. 대부분 이 정의에 동의할 겁니다. 다만 스타트업 환경에서 종종 ‘엔지니어’의 정의는 ‘비즈니스 조직의 요구를 기술로 반영해주는 사람’으로 빈번히 축소되곤 합니다. 이는 바람직하지 않습니다. 왜냐하면 제품 개발 속도의 비효율은 언젠가 비즈니스를 멈추게 만들고, 또한 문제는 비단 비즈니스 세계에서만 발생하지 않기 때문입니다. 제품과 제품 조직이 성장하면서 그 자체로 문제를 발생시키기도 하니까요. 흔히 생각하기로는 디자인 시스템이나 모노레포 같은 시스템이 예시가 되겠죠.

하지만 그런 개별적인 기술 개념어 말고, 좀 더 근본적인 부분을 문제로 인식하고 풀어나가야 하는 거 아닐까요? 우리는 왜 점점 기능을 추가하기 어려워질까요? 왜 업무 시간과 스트레스는 늘어나지만 개발 속도는 느려질까요? 왜 기존 시스템의 라이브러리 버전을 올리기가 어려워서 복잡한 workaround나 polyfill을 찾아 헤메야 하는걸까요? 왜 분명 예전에 개발했던 기능인데 재사용하지 못하고 바퀴를 매번 재발명하느라 야근을 해야 하는걸까요?

어쩌면 우리의 퇴근을 막고 업무 의욕이 저하되는 건 우리가 구조를 고민하기 위한 노력을 포기한 댓가는 아닌가 의심해봅니다. 엔지니어로서 현실에 존재하는 문제를 정의하고 적절한 도구를 선택하여 빠르게 해결한다, 옳습니다. 하지만 거기에 더하여 그 이상의 문제 의식을 가지고 ‘문제 정의와 해결의 과정을 더욱 효율적인 방식으로 최적화 해나간다’는 목표를 추구해보고 싶어졌습니다. 제 생각에 이건 특정 패턴을 적용한다 만다의 문제가 아니라, 오히려 우리가 ‘프로그래머 답게’ / ‘엔지니어 답게’ 일하고 있는지를 자문하는 일에 가깝습니다.

예를 들어 보겠습니다. 우리의 컴포넌트는 SOLID 원칙을 얼마나 준수하고 있나요? SOLID는 객체 지향 패러다임의 원칙이기 때문에 프론트엔드에는 필요가 없다고 생각하시나요? 어쩌면 그럴 수도 있겠지만, 그러면 우리가 작성하는 애플리케이션은 어떤 원칙에 기대어 좋은 코드와 나쁜 코드, 좋은 구조와 나쁜 구조를 판단해야 하는 걸까요?

> 좋은 소프트웨어 시스템은 깔끔한 코드(clean code)로부터 시작한다. 좋은 벽돌을 사용하지 않으면 빌딩의 아키텍처가 좋고 나쁨은 그리 큰 의미가 없는 것과 같다. 반대로 좋은 벽돌을 사용하더라도 빌딩의 아키텍처를 엉망으로 만들 수 있다. 그래서 좋은 벽돌로 좋은 아키텍처를 정의하는 원칙이 필요한데, 그게 바로 SOLID다. SOLID 원칙은 함수와 데이터 구조를 클래스로 배치하는 방법, 그리고 이들 클래스를 서로 결합하는 방법을 설명해준다. '클래스'라는 단어를 사용했다고 해서 SOLID 원칙이 객체 지향 소프트웨어에만 적용된다는 뜻은 아니다. 여기에서 클래스는 단순히 함수와 데이터를 결합한 집합을 가리킨다. 소프트웨어 시스템은 모두 이러한 집합을 포함하며, 이러한 집합이 클래스라고 불릴 수도 있고 아닐 수도 있다. - 62p

정말 우리는 ‘엔지니어링’을 하고 있나요? ‘문제를 해결’하고 있나요? 저는 우리 팀이 그런 팀이었으면 좋겠고, 단단하고 멋진 높은 수준의 제품을 만들어가고 싶습니다. 다만 그런 목표를 추구하기 위해 어떤 How 들을 실행할 것인지는 아직 모르겠습니다. 생각이 정리되는 대로 천천히 지금처럼 글로 정리해보겠습니다.