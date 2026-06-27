import { makeTester } from './_tester.js';
import banReverseDependency from '../eslint-rules/ban-reverse-dependency.js';
import banCrossFeatureImport from '../eslint-rules/ban-cross-feature-import.js';
import enforceRouteReexportOnly from '../eslint-rules/enforce-route-reexport-only.js';
import banQueryHookInComponent from '../eslint-rules/ban-query-hook-in-component.js';
import banSideeffectInComponent from '../eslint-rules/ban-sideeffect-in-component.js';

const tester = makeTester();

tester.run('ban-reverse-dependency', banReverseDependency, {
  valid: [
    { filename: '/src/app/Cart/containers/CartContainer.tsx', code: "import { format } from '@/shared/format';" },
    { filename: '/src/shared/format.ts', code: "import { http } from '@/external/http';" },
    { filename: '/src/app/Cart/x.ts', code: "import { useState } from 'react';" },
  ],
  invalid: [
    {
      filename: '/src/shared/format.ts',
      code: "import { CartContainer } from '@/app/Cart/containers/CartContainer';",
      errors: [{ messageId: 'reverse' }],
    },
    {
      filename: '/src/external/http.ts',
      code: "import { format } from '@/shared/format';",
      errors: [{ messageId: 'reverse' }],
    },
  ],
});

tester.run('ban-cross-feature-import', banCrossFeatureImport, {
  valid: [
    { filename: '/src/app/Cart/containers/CartContainer.tsx', code: "import { Row } from '@/app/Cart/components/Row';" },
    { filename: '/src/app/Cart/x.ts', code: "import { Money } from '@/app/common/Money';" },
    { filename: '/src/app/Cart/x.ts', code: "import { format } from '@/shared/format';" },
  ],
  invalid: [
    {
      filename: '/src/app/Cart/containers/CartContainer.tsx',
      code: "import { useWallet } from '@/app/Wallet/hooks/useWallet';",
      errors: [{ messageId: 'crossFeature' }],
    },
  ],
});

tester.run('enforce-route-reexport-only', enforceRouteReexportOnly, {
  valid: [
    { filename: '/src/routes/cart/index.ts', code: "export { CartPage } from '@/app/Cart';" },
    { filename: '/src/routes/cart/index.ts', code: "export * from '@/app/Cart';" },
    { filename: '/src/routes/cart/index.ts', code: "import { CartPage } from '@/app/Cart';\nexport default CartPage;" },
  ],
  invalid: [
    {
      filename: '/src/routes/cart/index.tsx',
      code: 'export default function CartPage() { return null; }',
      errors: [{ messageId: 'routeBody' }],
    },
    {
      filename: '/src/routes/cart/index.ts',
      code: 'const handler = () => 1;\nexport { handler };',
      errors: [{ messageId: 'routeBody' }, { messageId: 'routeBody' }],
    },
  ],
});

tester.run('ban-query-hook-in-component', banQueryHookInComponent, {
  valid: [
    { filename: '/src/app/Cart/components/Row.tsx', code: 'function Row({ total }) { return total; }' },
    { filename: '/src/app/Cart/containers/CartContainer.tsx', code: 'function C() { const x = useCartSuspenseQuery(); return x; }' },
  ],
  invalid: [
    {
      filename: '/src/app/Cart/components/Row.tsx',
      code: 'function Row() { const { data } = useCartSuspenseQuery(); return data; }',
      errors: [{ messageId: 'queryInComponent' }],
    },
  ],
});

tester.run('ban-sideeffect-in-component', banSideeffectInComponent, {
  valid: [
    { filename: '/src/app/Cart/components/Row.tsx', code: 'function Row({ onSelect }) { return onSelect; }' },
    { filename: '/src/app/Cart/containers/CartContainer.tsx', code: 'function C() { navigate("/home"); }' },
  ],
  invalid: [
    {
      filename: '/src/app/Cart/components/Row.tsx',
      code: 'function Row() { navigate("/home"); return null; }',
      errors: [{ messageId: 'sideEffect' }],
    },
  ],
});
