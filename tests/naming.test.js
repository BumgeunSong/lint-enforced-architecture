import { makeTester } from './_tester.js';
import enforceFileSuffix from '../eslint-rules/enforce-file-suffix.js';
import enforceContainerNaming from '../eslint-rules/enforce-container-naming.js';
import enforceHandlerNaming from '../eslint-rules/enforce-handler-naming.js';

const tester = makeTester();

tester.run('enforce-file-suffix', enforceFileSuffix, {
  valid: [
    { filename: '/src/app/Cart/models/cart.model.ts', code: 'export const x = 1;' },
    { filename: '/src/app/Cart/constants/cart.const.ts', code: 'export const x = 1;' },
    { filename: '/src/app/Cart/api/cart.api.ts', code: 'export const x = 1;' },
    { filename: '/src/app/Cart/models/index.ts', code: 'export const x = 1;' },
    { filename: '/src/app/Cart/components/Row.tsx', code: 'export const x = 1;' },
  ],
  invalid: [
    { filename: '/src/app/Cart/models/cart.ts', code: 'export const x = 1;', errors: [{ messageId: 'suffix' }] },
    { filename: '/src/app/Cart/constants/cart.ts', code: 'export const x = 1;', errors: [{ messageId: 'suffix' }] },
  ],
});

tester.run('enforce-container-naming', enforceContainerNaming, {
  valid: [
    { filename: '/src/app/Cart/containers/CartContainer.tsx', code: 'export function CartContainer() {}' },
    { filename: '/src/app/Cart/containers/index.ts', code: 'export const x = 1;' },
    { filename: '/src/app/Cart/components/Row.tsx', code: 'export function Row() {}' },
  ],
  invalid: [
    {
      filename: '/src/app/Cart/containers/Cart.tsx',
      code: 'export function Cart() {}',
      errors: [{ messageId: 'containerName' }],
    },
  ],
});

tester.run('enforce-handler-naming', enforceHandlerNaming, {
  valid: [
    { filename: '/src/app/Cart/components/Row.tsx', code: 'interface RowProps { onSelect: () => void; }' },
    { filename: '/src/app/Cart/components/Row.tsx', code: 'interface RowProps { total: number; }' },
    { filename: '/src/app/Cart/components/Row.tsx', code: 'type RowProps = { onSelect: () => void };' },
  ],
  invalid: [
    {
      filename: '/src/app/Cart/components/Row.tsx',
      code: 'interface RowProps { handleSelect: () => void; }',
      errors: [{ messageId: 'onPrefix' }],
    },
    {
      filename: '/src/app/Cart/components/Row.tsx',
      code: 'type RowProps = { handleSelect: () => void };',
      errors: [{ messageId: 'onPrefix' }],
    },
  ],
});
