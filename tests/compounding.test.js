import { makeTester } from './_tester.js';
import enforceQueryHookSuffix from '../eslint-rules/enforce-query-hook-suffix.js';
import enforceSuspenseForSuspenseQuery from '../eslint-rules/enforce-suspense-for-suspense-query.js';
import enforceModelFnToPrefix from '../eslint-rules/enforce-model-fn-to-prefix.js';
import requireLoadingOnMutation from '../eslint-rules/require-loading-on-mutation.js';
import banFunctionsInConstTs from '../eslint-rules/ban-functions-in-const-ts.js';

const tester = makeTester();

// Pair 1, scaffold: name the hook after the query it wraps.
tester.run('enforce-query-hook-suffix', enforceQueryHookSuffix, {
  valid: [
    { filename: '/src/app/Cart/queries/useCart.ts', code: 'export function useCartSuspenseQuery() { return useSuspenseQuery(opts); }' },
    { filename: '/src/app/Cart/queries/useCart.ts', code: 'export function useCartQuery() { return useQuery(opts); }' },
    { filename: '/src/app/Cart/queries/useCart.ts', code: 'export function useCartCount() { return 1; }' },
  ],
  invalid: [
    {
      filename: '/src/app/Cart/queries/useCart.ts',
      code: 'export function useCart() { return useSuspenseQuery(opts); }',
      errors: [{ messageId: 'suspenseSuffix' }],
    },
    {
      filename: '/src/app/Cart/queries/useCart.ts',
      code: 'export const useCart = () => useQuery(opts);',
      errors: [{ messageId: 'querySuffix' }],
    },
  ],
});

// Pair 1, dependent: a *SuspenseQuery call requires a Suspense import in the file.
tester.run('enforce-suspense-for-suspense-query', enforceSuspenseForSuspenseQuery, {
  valid: [
    {
      filename: '/src/app/Cart/containers/CartContainer.tsx',
      code: "import { Suspense } from 'react';\nfunction C() { return useCartSuspenseQuery(); }",
    },
    { filename: '/src/app/Cart/containers/CartContainer.tsx', code: 'function C() { return useCartQuery(); }' },
  ],
  invalid: [
    {
      filename: '/src/app/Cart/containers/CartContainer.tsx',
      code: 'function C() { return useCartSuspenseQuery(); }',
      errors: [{ messageId: 'missingSuspense' }],
    },
  ],
});

// Pair 2, dependent: model transforms are named to*. Keys off the .model.ts suffix.
tester.run('enforce-model-fn-to-prefix', enforceModelFnToPrefix, {
  valid: [
    { filename: '/src/app/Cart/models/cart.model.ts', code: 'export function toCartModel(raw) { return raw; }' },
    { filename: '/src/app/Cart/models/cart.model.ts', code: 'export const toCartSummary = (raw) => raw;' },
    { filename: '/src/app/Cart/models/cart.model.ts', code: 'export const TOTAL = 10;' },
    { filename: '/src/app/Cart/containers/CartContainer.tsx', code: 'export function buildCart() {}' },
  ],
  invalid: [
    {
      filename: '/src/app/Cart/models/cart.model.ts',
      code: 'export function cartModel(raw) { return raw; }',
      errors: [{ messageId: 'toPrefix' }],
    },
  ],
});

// Pair 3, dependent: writes in a container must be wrapped in a loading guard.
tester.run('require-loading-on-mutation', requireLoadingOnMutation, {
  valid: [
    {
      filename: '/src/app/Cart/containers/CartContainer.tsx',
      code: 'async function submit() { await withLoading(postCheckout(data)); }',
    },
    {
      filename: '/src/app/Cart/components/Row.tsx',
      code: 'async function submit() { await postCheckout(data); }',
    },
  ],
  invalid: [
    {
      filename: '/src/app/Cart/containers/CartContainer.tsx',
      code: 'async function submit() { await postCheckout(data); }',
      errors: [{ messageId: 'missingLoading' }],
    },
    {
      filename: '/src/app/Cart/containers/CartContainer.tsx',
      code: 'async function submit() { await mutation.mutateAsync(data); }',
      errors: [{ messageId: 'missingLoading' }],
    },
  ],
});

// Second dependent of the .const.ts scaffold: no functions in a constants file.
tester.run('ban-functions-in-const-ts', banFunctionsInConstTs, {
  valid: [
    { filename: '/src/app/Cart/constants/cart.const.ts', code: 'export const LIMIT = 10;' },
    { filename: '/src/app/Cart/models/cart.model.ts', code: 'export function toCartModel() {}' },
  ],
  invalid: [
    {
      filename: '/src/app/Cart/constants/cart.const.ts',
      code: 'export function clamp(n) { return n; }',
      errors: [{ messageId: 'noFunction' }],
    },
    {
      filename: '/src/app/Cart/constants/cart.const.ts',
      code: 'export const clamp = (n) => n;',
      errors: [{ messageId: 'noFunction' }],
    },
  ],
});
