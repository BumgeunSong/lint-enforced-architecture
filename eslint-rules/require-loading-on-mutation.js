/**
 * require-loading-on-mutation   [dependent half of compounding pair #3]
 *
 * Inside a container, an awaited write call (postX / putX / patchX / deleteX or
 * `.mutateAsync`) must be wrapped in the project's `withLoading(...)` guard. That
 * guard disables the trigger while the request is in flight, so a double tap
 * cannot fire the mutation twice.
 *
 * This rule is scoped to `containers/`, which is meaningful only because
 * enforce-container-naming makes "this is a container" a reliable, name-checkable
 * fact. Location convention is the scaffold; this behavioral rule stacks on top.
 */
import { toPosix } from './_utils.js';

const WRITE_VERB = /^(post|put|patch|delete)([A-Z0-9]|$)/;
const LOADING_GUARDS = new Set(['withLoading', 'startLoading']);

function isWriteCall(callee) {
  if (callee.type === 'Identifier') return WRITE_VERB.test(callee.name);
  if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
    const prop = callee.property.name;
    return prop === 'mutateAsync' || WRITE_VERB.test(prop);
  }
  return false;
}

function isWrappedInGuard(node) {
  let current = node.parent;
  while (current) {
    if (
      current.type === 'CallExpression' &&
      current.callee.type === 'Identifier' &&
      LOADING_GUARDS.has(current.callee.name)
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Require awaited write calls in containers to be wrapped in a loading guard.' },
    schema: [],
    messages: {
      missingLoading:
        'This write call is not wrapped in withLoading(...). Guard it so a double tap cannot fire it twice.',
    },
  },
  create(context) {
    if (!/\/containers\//.test(toPosix(context.filename))) return {};

    return {
      AwaitExpression(node) {
        const arg = node.argument;
        if (arg.type !== 'CallExpression') return;
        if (!isWriteCall(arg.callee)) return;
        if (isWrappedInGuard(node)) return;
        context.report({ node: arg, messageId: 'missingLoading' });
      },
    };
  },
};
