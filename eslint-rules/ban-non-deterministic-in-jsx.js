/**
 * ban-non-deterministic-in-jsx
 *
 * `new Date()`, `Date.now()` and `Math.random()` produce a different value on the
 * server than on the client, so calling them directly inside JSX causes a
 * hydration mismatch. Compute the value outside render (or in an effect) and pass
 * it in.
 */
function isNonDeterministic(node) {
  if (node.type === 'NewExpression') return node.callee.type === 'Identifier' && node.callee.name === 'Date';
  if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
    const obj = node.callee.object;
    const prop = node.callee.property;
    if (obj.type !== 'Identifier' || prop.type !== 'Identifier') return false;
    return (obj.name === 'Date' && prop.name === 'now') || (obj.name === 'Math' && prop.name === 'random');
  }
  return false;
}

function insideJsx(node) {
  let current = node.parent;
  while (current) {
    if (current.type === 'JSXExpressionContainer') return true;
    if (current.type === 'FunctionDeclaration' || current.type === 'ArrowFunctionExpression') {
      // a nested function (e.g. an event handler) breaks the "directly in JSX" chain
      return false;
    }
    current = current.parent;
  }
  return false;
}

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Forbid non-deterministic calls (Date / Math.random) directly inside JSX.' },
    schema: [],
    messages: {
      nonDeterministic: 'Non-deterministic value in JSX causes a hydration mismatch. Compute it outside render.',
    },
  },
  create(context) {
    function check(node) {
      if (isNonDeterministic(node) && insideJsx(node)) {
        context.report({ node, messageId: 'nonDeterministic' });
      }
    }
    return { CallExpression: check, NewExpression: check };
  },
};
