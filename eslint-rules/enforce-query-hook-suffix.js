/**
 * enforce-query-hook-suffix   [scaffold of compounding pair #1]
 *
 * A custom hook in `queries/` is named after the kind of query it wraps:
 *   - calls useSuspenseQuery -> must end in `...SuspenseQuery`
 *   - calls useQuery         -> must end in `...Query`
 *
 * On its own this looks like a fussy, subjective naming rule ("why bother?").
 * Its real value is as a foothold: once every suspense hook is *guaranteed* to
 * end in `SuspenseQuery`, the next rule (enforce-suspense-for-suspense-query)
 * can find them by name alone. Naming first, then the harder rule gets easy.
 */
import { toPosix } from './_utils.js';

function hookName(node) {
  if (node.type === 'FunctionDeclaration') return node.id?.name ?? null;
  const parent = node.parent;
  if (parent?.type === 'VariableDeclarator' && parent.id.type === 'Identifier') return parent.id.name;
  return null;
}

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Require query hooks to be named for the query they wrap (*SuspenseQuery / *Query).' },
    schema: [],
    messages: {
      suspenseSuffix: "Hook '{{name}}' calls useSuspenseQuery and must end in 'SuspenseQuery'.",
      querySuffix: "Hook '{{name}}' calls useQuery and must end in 'Query'.",
    },
  },
  create(context) {
    if (!/\/queries\//.test(toPosix(context.filename))) return {};

    const stack = [];
    function enter(node) {
      stack.push({ name: hookName(node), node, usesSuspense: false, usesQuery: false });
    }
    function exit() {
      const frame = stack.pop();
      if (!frame || !frame.name || !frame.name.startsWith('use')) return;
      if (frame.usesSuspense && !frame.name.endsWith('SuspenseQuery')) {
        context.report({ node: frame.node, messageId: 'suspenseSuffix', data: { name: frame.name } });
      } else if (frame.usesQuery && !frame.name.endsWith('Query')) {
        context.report({ node: frame.node, messageId: 'querySuffix', data: { name: frame.name } });
      }
    }

    return {
      FunctionDeclaration: enter,
      'FunctionDeclaration:exit': exit,
      FunctionExpression: enter,
      'FunctionExpression:exit': exit,
      ArrowFunctionExpression: enter,
      'ArrowFunctionExpression:exit': exit,
      CallExpression(node) {
        const frame = stack[stack.length - 1];
        if (!frame || node.callee.type !== 'Identifier') return;
        if (node.callee.name === 'useSuspenseQuery') frame.usesSuspense = true;
        if (node.callee.name === 'useQuery') frame.usesQuery = true;
      },
    };
  },
};
