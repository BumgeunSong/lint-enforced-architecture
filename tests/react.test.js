import { makeTester } from './_tester.js';
import banDerivedStateInEffect from '../eslint-rules/ban-derived-state-in-effect.js';
import banNonDeterministicInJsx from '../eslint-rules/ban-non-deterministic-in-jsx.js';

const tester = makeTester();

tester.run('ban-derived-state-in-effect', banDerivedStateInEffect, {
  valid: [
    { filename: '/src/app/Cart/components/List.tsx', code: 'const filtered = items.filter((x) => x.active);' },
    { filename: '/src/app/Cart/components/List.tsx', code: 'useEffect(() => { sendAnalytics(); }, []);' },
  ],
  invalid: [
    {
      filename: '/src/app/Cart/components/List.tsx',
      code: 'useEffect(() => { setFiltered(items.filter((x) => x.active)); }, [items]);',
      errors: [{ messageId: 'derived' }],
    },
  ],
});

tester.run('ban-non-deterministic-in-jsx', banNonDeterministicInJsx, {
  valid: [
    { filename: '/src/app/Cart/components/Now.tsx', code: 'function Now({ now }) { return <span>{now}</span>; }' },
    {
      filename: '/src/app/Cart/components/Now.tsx',
      code: 'function Now() { const now = Date.now(); return <span>{now}</span>; }',
    },
  ],
  invalid: [
    {
      filename: '/src/app/Cart/components/Now.tsx',
      code: 'function Now() { return <span>{Date.now()}</span>; }',
      errors: [{ messageId: 'nonDeterministic' }],
    },
    {
      filename: '/src/app/Cart/components/Now.tsx',
      code: 'function Now() { return <span>{new Date().toString()}</span>; }',
      errors: [{ messageId: 'nonDeterministic' }],
    },
  ],
});
