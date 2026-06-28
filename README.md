# Lint로 강제하는 아키텍처

> 글 **"AI 시대의 개발자는 검증을 설계한다 (2) Lint 편"** 예제입니다.

---

## 한 문장으로

커스텀 ESLint 룰 **15개**. 문법이 아니라 **구조**를 잡습니다. 레이어 경계, 의존성 방향, 파일·함수 이름, 데이터 가져오는 방식. 타입 체크도 테스트도 못 잡는 구조의 어긋남을 Lint가 매번 똑같은 기준으로 막아줍니다.

모든 룰은 하나의 폴더 구조를 전제합니다.

```
src/
  app/        기능(feature). 최상위. shared·external을 가져다 씀
    Cart/
      components/   화면만 그림
      containers/   데이터·사이드이펙트를 묶음
      queries/      데이터 훅
      models/       순수 변환 (*.model.ts)
      constants/    값만 (*.const.ts)
  shared/     재사용 블록. external만 가져다 씀
  external/   바깥 세계 어댑터. 내부를 안 가져다 씀
```

의존성은 한 방향뿐입니다. **app → shared → external.**

---

## 1. Lint는 문법이 아니라 구조를 잡는다

맞춤법 검사기로만 알던 Lint가 사실은 아키텍처를 강제합니다. 몇 개만 보죠.

**의존성 방향을 막습니다.**

```ts
// src/shared/format.ts
import { CartContainer } from '@/app/Cart/...'  // ❌ shared가 app을 끌어다 씀
```

`app → shared → external` 의 거꾸로입니다. 컴파일은 멀쩡히 통과하지만 경계가 조용히 무너집니다. `ban-reverse-dependency` 가 이걸 빌드 전에 막습니다.

**컴포넌트와 컨테이너를 갈라놓습니다.**

```tsx
// src/app/Cart/components/Row.tsx
const { data } = useCartSuspenseQuery()  // ❌ 화면 컴포넌트가 데이터를 직접 가져옴
navigate('/home')                        // ❌ 사이드이펙트도 직접 일으킴
```

컴포넌트는 props만 그립니다. 데이터를 가져오고 어디로 보낼지 정하는 건 컨테이너 몫입니다. `ban-query-hook-in-component` 와 `ban-sideeffect-in-component` 가 이 선을 지킵니다.

**진입점을 얇게 유지합니다.**

```ts
// src/routes/cart/index.ts
export { CartPage } from '@/app/Cart'    // ✅ 라우트 파일엔 re-export만
```

함수 본체나 JSX가 라우트 파일에 끼어들면 `enforce-route-reexport-only` 가 막습니다.

나머지 구조 룰도 결은 같습니다.

- `ban-cross-feature-import` : Cart가 Wallet 내부를 직접 import 금지. 공유는 `common`·`shared` 경유
- `enforce-file-suffix` : `models/`는 `.model.ts`, `constants/`는 `.const.ts`, `api/`는 `.api.ts`
- `enforce-container-naming` : `containers/` 직속 파일은 `~Container`
- `enforce-handler-naming` : `~Props` 의 콜백은 `on~` (내부 핸들러만 `handle~`)
- `ban-derived-state-in-effect` : `useEffect` 안에서 `setX(...)` 로 파생값 계산 금지. 렌더 중 계산이 정답
- `ban-non-deterministic-in-jsx` : JSX 안의 `Date.now()`·`Math.random()` 금지. hydration mismatch의 원인

이름만 보고도 이게 어느 층의 무엇인지 알게 됩니다. 타입 체커도 테스트도 못 해주는 일입니다.

---

## 2. 먼저 만든 룰이 다음 룰을 쉽게 만든다

글의 핵심입니다. 독립적인 룰을 하나씩 더하는 게 아닙니다. **이름과 구조를 먼저 잡아두면 그 위에 더 어려운 룰을 몇 줄로 얹을 수 있습니다.**

```ts
// 1단계. 발판이 되는 이름 규칙
function useCartSuspenseQuery() {     // useSuspenseQuery를 쓰면
  return useSuspenseQuery(opts)       // 이름이 반드시 ...SuspenseQuery 로 끝나야 함
}

// 2단계. 1단계 덕분에 가능해진 룰
// ...SuspenseQuery 를 호출하는 파일엔 <Suspense> 가 있어야 한다
import { Suspense } from 'react'      // 빠지면 에러
```

`useSuspenseQuery` 를 쓰는 훅은 `useCartSuspenseQuery`, `useUserSuspenseQuery` 처럼 이름이 제각각입니다. 그래서 어떤 게 suspense 훅인지 알아내는 것부터가 까다롭습니다. 그런데 이름 규칙(`enforce-query-hook-suffix`)을 **먼저** 걸어두면, 다음 룰(`enforce-suspense-for-suspense-query`)은 그냥 이름으로 찾아서 `Suspense` 가 있는지 보면 끝입니다. 발판 하나가 어려운 룰을 [몇 줄짜리](./eslint-rules/enforce-suspense-for-suspense-query.js)로 줄여버립니다.

같은 곱셈이 이 저장소에 네 쌍 들어 있습니다.

- `enforce-query-hook-suffix` → `enforce-suspense-for-suspense-query`
- `enforce-file-suffix`(`.model.ts` 보장) → `enforce-model-fn-to-prefix`(모델 함수는 `to~`)
- `enforce-file-suffix`(`.const.ts` 보장) → `ban-functions-in-const-ts`(상수 파일엔 함수 금지)
- `enforce-container-naming`(여기가 컨테이너임을 보장) → `require-loading-on-mutation`(write 호출은 `withLoading` 으로 감쌈)

먼저 잡은 이름·위치가 발판이 되고, 그 위에서 내용·동작을 검사하는 룰이 쉬워집니다.

---

## 3. 효과 있는 룰은 주관적이다

위 룰들은 객관적으로 옳은 코드가 아닙니다. 특정 팀의 취향을 규칙으로 좁힌 것뿐입니다. `useMutation` 대신 컨테이너에서 직접 호출한다, ref 변수는 `ref~` 로 시작한다. 다 멀쩡히 돌아가는 다른 방식이 있는데도 하나로 통일한 겁니다.

바로 그래서 효과가 납니다. 주관적일수록 구체적이고, 구체적일수록 AI가 해석할 여백이 사라집니다. '함수는 한 가지 일만 해라' 같은 원칙은 해석이 분분하지만, '`else` 쓰지 말고 `if` 는 맨 위에' 같은 규칙은 기계가 바로 잡습니다.

그러니 이 룰들을 그대로 베끼지 마세요. 여러분 코드베이스엔 여러분 취향의 룰이 쌓여야 합니다. 이 저장소는 정답이 아니라 **출발점**입니다.

---

## 직접 돌려보고 싶다면

```bash
npm install
npm test     # 15개 룰의 valid/invalid 픽스처 64개 전부 실행
```

각 룰이 무엇을 잡고 무엇을 그냥 두는지는 [`tests/`](./tests) 의 픽스처에 그대로 적혀 있습니다. 룰의 의도가 궁금하면 거기부터 보세요.

내 프로젝트에 끼우려면 `index.js` 가 내보내는 `architecture` 플러그인과 `recommended` 설정을 쓰면 됩니다.
