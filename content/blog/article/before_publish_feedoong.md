---
title: 2023-03-29 피둥 프로젝트의 프로덕션 배포를 앞두고
date: 2023-03-29
description: 나도 조금은 개발 실력이 쪘을까?
tags: [Article]
thumbnail: /thumbnails/hello-world.jpg
draft: true
---

놀랍게도 피둥의 첫 커밋은 2022년 8월 22일, 낙성대 역 인근 어느 카페에서 이뤄졌다. 더운 날 신림 쪽에 있는 동명의 카페로 혼동하여 헛걸음을 한 영재님이 다시 낙성대 카페로 왔고, 초기 세팅을 부탁드렸다. 그로부터 일곱 달이 지난 3월 29일, 현재 커밋 갯수는 661개가 되었고 이제는 정말 프로덕션 배포를 앞두고 있다.

처음에는 3달 내에, 그 다음에는 22년 내에, 또다시 그 다음에는 2월 내에, 그리고 벌써 23년도의 1분기가 다 지나가고 있는데 이제는 프로덕션 배포야 하든지 말든지 상관 없다는 마인드가 되어가고 있다. 서버 비용을 어찌어찌 크레딧으로 메우고 있는 점이 가장 중요한 부분이기도 하지만, 내가 항상 중요하게 생각하는 가치는 '지속가능성'이다. 일곱 달이나 걸렸지만 어찌 보면 일곱 달 동안은 꾸준히 개발을 하고 있었다는 말로 뒤집어 볼 수도 있는 것이다. 그러한 버티기 속에서 문득 깨닫음의 순간들을 만나기도 했다.

내겐 '나는 개발을 잘 못한다'고 생각하는 컴플렉스가 있다. 그간 공부했던 양에 비해 실제 내 손을 움직여 코드를 작성하고 기능을 구현해본 경험이 현저하게 적었던 탓이다. 정말 실전에서 기한을 맞춰가며 구현을 해야 한다면 충분한 고민의 기회가 주어지지 않으므로 적당한 수준(ex. 80%)에서 타협을 봐야할 것이고, 이게 현 시점 솔직한 나의 실력이라고 해야 할 것이다. 입코딩으로는 어찌어찌 개발을 하겠지만 이러한 지점에서 약점이 있다는 사실을 스스로가 잘 알고 있다. 더군다나 22년도 내내 인터널 제품 위주로 작성을 하다보니 일반적으로 으레 B2C 제품을 만들 때 겪게 되는 유저 사이드의 상황들을 실제 만나보고, 해결해 본 구체적인 경험이 부족했다.

좋으나 싫으나 바닥부터 만들어야 했는데, 피둥의 PoC 였던 토이 프로젝트(https://saengmotmi-rss.vercel.app/rss)는 그다지 어렵지 않게 만들 수 있었던데 비해 피둥의 경우에는 기능 구현을 넘어 적당한 복잡도를 견딜 수 있는 좋은 구조, 좋은 코드를 고민하기 위한 플레이그라운드 역할도 겸하고 있었기에 적잖은 시행착오가 있었다. 가장 대표적인 예시로는 로그인 세션을 관리하면서 겪은 다양한 이슈들을 예시로 들 수 있을 것이다.

우습게도 꽤나 최근까지도 피둥은 하루에 한번 로그인이 풀리는 서비스였다. 피둥은 액세스 토큰과 리프레시 토큰 쌍을 쿠키로 저장하면서 액세스 토큰 만료 시 자동으로 토큰을 갱신하도록 하고 있다. 하지만 어떤 이유에선지 액세스 토큰을 재발급하는 과정에서 리프레시 토큰이 잘못 되었다는 에러와 함께 세션 갱신에 실패하고 있었다. 디버깅을 위해 상황을 통제해보려고도 했지만 재현 조건도 쉽사리 특정되지 않아 애를 먹었다. 문제는 유저 1인 당 리프레시 토큰을 1개만 발급하도록 하는 서버 로직에 있었다. 한 명의 유저가 여러 기기를 사용할 경우 타 기기의 리프레시 토큰이 무효화 됐던 것이다. 이 외에도 토큰 발급 시 발생하는 동시성 문제도 최근에 해결한 문제다.

SSR 상황에서 유저 정보를 포함한 서버 상태를 일관되면서도 효과적으로 다룰 수 있는 방법을 찾기 위한 고민도 긴 시간 이어졌다. 피둥은 Next.js를 기술 스택으로 사용하고 있기 때문에 SSR을 지원할 수 있는데, 이 때문에 발생했던 문제도 몇 가지 있었다. Axios나 React Query의 QueryClient 등의 인스턴스를 싱글턴으로 두는 실수 같은 것들을 했는데, 대체로 서버에서 호출했던 데이터를 각 유저에게 정확하게 전달하지 못해서 생기는 경우였다.

이 외에도 자잘한 CSS 이슈(vh-dvh 문제, 반응형, 말줄임표 등)도 있었고, 아주 간단하게나마 크롬 익스텐션을 작성해보거나... 하는 여러 가지 경험들을 해볼 수 있었다.