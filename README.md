# 아키텍처를 강제하는 Lint — 쇼케이스

> 글 **"AI 시대의 개발자는 검증을 설계한다 (2)"** 의 동반 예제 저장소입니다.
> "Lint가 아키텍처를 강제한다"는 게 구체적으로 어떤 코드인지 보고 싶은 분을 위해 만들었습니다.

이 저장소는 **커스텀 ESLint 룰 15개**로 이루어진 작은 플러그인입니다. 문법을 잡는 룰이 아니라, **레이어 경계 · 의존성 방향 · 파일/함수 네이밍 · 데이터 페칭 패턴**을 정적으로 강제하는 룰들입니다. 타입 체커도 자동화 테스트도 잡아주지 못하는 "구조의 어긋남"을, Lint가 결정론적으로(매번, 빠짐없이, 같은 기준으로) 막아줍니다.

각 룰에는 `tests/`에 valid/invalid 픽스처가 붙어 있습니다. **무엇을 잡고 무엇을 그냥 두는지**가 그 픽스처에 그대로 적혀 있으니, 룰의 의도가 궁금하면 테스트부터 보세요.

---

## 전제하는 아키텍처

모든 룰은 하나의 레이어드 구조를 전제합니다. 룰들은 대부분 **파일 경로만 읽어** 자기가 어느 레이어/폴더에 있는지 판단합니다. 이 값싼 구조 신호가, 뒤에 나오는 더 어려운 룰들의 발판이 됩니다.

```
src/
  app/                 # 기능(feature). 최상위 레이어 (shared, external import 가능)
    <Feature>/
      components/       # 순수 표현 — UI만
      containers/       # 오케스트레이션 — 데이터 + 사이드 이펙트
      queries/          # 데이터 페칭 훅
      models/           # 순수 데이터 변환 (*.model.ts)
      constants/        # 리터럴 값 (*.const.ts)
  shared/              # 재사용 블록 (external만 import 가능)
  external/            # 바깥 세계 어댑터 (내부를 import하지 않음)
```

의존성 방향은 한 방향뿐입니다: **app → shared → external**.

---

## 룰 15개

### 1. 경계 & 의존성 방향 (Architecture & Boundaries)

컴파일은 멀쩡히 통과하는데 아키텍처가 조용히 무너지는 import 흐름을 막습니다.

| 룰 | 무엇을 잡나 |
| --- | --- |
| `ban-reverse-dependency` | `shared`가 `app`을, `external`이 `app/shared`를 import — 역방향 의존성 |
| `ban-cross-feature-import` | 한 feature가 다른 feature의 내부를 직접 import (공유는 `app/common`·`shared` 경유) |
| `enforce-route-reexport-only` | 라우트 진입 파일에 re-export 외의 코드(함수/JSX)가 들어감 |
| `ban-query-hook-in-component` | `components/` 안에서 `use*Query` 데이터 훅 호출 |
| `ban-sideeffect-in-component` | `components/` 안에서 `navigate(...)` 사이드 이펙트 |

뒤 두 룰이 **components/containers 분리**의 양면입니다: 컴포넌트는 props를 그리고, 컨테이너가 그 props와 사이드 이펙트를 결정합니다.

### 2. 이름이 곧 레이어 (Naming & File Layout)

파일명·식별자만 보고도 그게 어느 층의 무엇인지 알게 합니다.

| 룰 | 무엇을 잡나 |
| --- | --- |
| `enforce-file-suffix` | `models/*.model.ts`, `constants/*.const.ts`, `api/*.api.ts` 접미사 |
| `enforce-container-naming` | `containers/` 직속 파일은 `*Container` 로 끝나야 함 |
| `enforce-handler-naming` | `*Props` 의 콜백은 `on*` (내부 핸들러만 `handle*`) |

### 3. React 정확성 (React Correctness)

타입은 통과하지만 런타임에서 터지는 흔한 footgun.

| 룰 | 무엇을 잡나 |
| --- | --- |
| `ban-derived-state-in-effect` | `useEffect` 안에서 `setX(...)` 로 파생 상태 계산 (렌더 중 계산이 정답) |
| `ban-non-deterministic-in-jsx` | JSX 안의 `new Date()` · `Date.now()` · `Math.random()` → hydration mismatch |

---

## ⭐ 곱셈으로 강해지는 Lint — 4개의 의존 쌍

글의 핵심 주장: **먼저 만든 룰이 다음 룰을 쉽게 만들어 준다.** 이름·구조를 먼저 강하게 잡아두면, 그 위에 더 어려운 룰을 몇 줄로 얹을 수 있습니다. 이 저장소는 그 "곱셈"을 4개의 구체적인 쌍으로 보여줍니다.

| 발판 (scaffold) | → | 그 위에 얹은 룰 (dependent) |
| --- | --- | --- |
| `enforce-query-hook-suffix` — suspense 훅은 `...SuspenseQuery` 로 끝남 | → | `enforce-suspense-for-suspense-query` — `*SuspenseQuery` 호출 파일은 `Suspense` import 필수 |
| `enforce-file-suffix` — `.model.ts` 보장 | → | `enforce-model-fn-to-prefix` — 모델 변환 함수는 `to*` |
| `enforce-file-suffix` — `.const.ts` 보장 | → | `ban-functions-in-const-ts` — 상수 파일엔 함수 금지 |
| `enforce-container-naming` — "여기는 컨테이너" 보장 | → | `require-loading-on-mutation` — 컨테이너의 write 호출은 `withLoading` 으로 감싸야 함 |

첫 번째 쌍이 글에 나온 바로 그 예시입니다. `useSuspenseQuery`를 쓰는 훅은 이름이 제각각(`useCartSuspenseQuery`, `useUserSuspenseQuery`...)이라, "어떤 게 suspense 훅인지" 알아내는 것부터가 어렵습니다. 그런데 이름 규칙(`...SuspenseQuery`)을 **먼저** 걸어두면, 다음 룰은 그냥 이름으로 찾아서 `Suspense`가 있는지 검사하면 끝입니다. 발판이 없었다면 까다로웠을 룰이, 발판 덕분에 [몇 줄](./eslint-rules/enforce-suspense-for-suspense-query.js)로 줄어듭니다.

---

## 실행

```bash
npm install
npm test        # 15개 룰의 valid/invalid 픽스처 전부 실행
```

## 내 프로젝트에 끼우기

```js
// eslint.config.js (flat config)
import architecture from 'eslint-plugin-architecture-showcase';

export default [
  architecture.configs.recommended,
  // 또는 개별 제어:
  // {
  //   plugins: { architecture },
  //   rules: { 'architecture/ban-reverse-dependency': 'error' },
  // },
];
```

---

## 한 가지 짚을 점

이건 **AI라서 되는 게 아닙니다.** Lint로 이 정도까지 강제할 수 있다는 건 AI 이전부터 가능했습니다. 다만 AI 시대에 와서 (1) 패턴 매칭 룰을 **싸게** 만들 수 있게 됐고, (2) 룰 위반을 AI가 **순식간에** 고치며, (3) 일관된 패턴을 AI가 **증폭**해 재생산하기 때문에 — 이제 안 할 이유가 사라졌을 뿐입니다.

그리고 효과를 내는 룰은 대부분 **주관적**입니다. 위 룰들도 "객관적으로 옳은 코드"가 아니라 *특정 팀의 취향을 규칙으로 좁힌 것들*입니다. 여러분의 코드베이스엔 여러분의 취향이 담긴 룰이 쌓여야 합니다. 이 저장소는 베끼라고 있는 게 아니라, **"이런 것까지 Lint로 잡히는구나"** 의 출발점으로 보시길 바랍니다.

> 이 룰들은 실제 프로덕션 ESLint 플러그인을 일반화(서비스명·라이브러리명 제거)한 예제입니다. 레이어·파일명 같은 범용 구조만 남겼습니다.
