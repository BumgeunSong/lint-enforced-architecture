/**
 * ban-derived-state-in-effect
 *
 * A useEffect whose entire body is a single `setX(...)` derived from its deps is
 * almost always a mistake: the value should be computed during render, not
 * synced through an extra render pass that flashes stale UI and invites bugs.
 *
 *   useEffect(() => { setFiltered(items.filter(x => x.active)); }, [items]);
 *   // -> const filtered = items.filter(x => x.active);
 */
const SETTER = /^set[A-Z]/;

function singleStatement(callback) {
  if (callback.type !== 'ArrowFunctionExpression' && callback.type !== 'FunctionExpression') return null;
  const body = callback.body;
  if (body.type !== 'BlockStatement' || body.body.length !== 1) return null;
  return body.body[0];
}

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Forbid computing derived state inside a useEffect setter.' },
    schema: [],
    messages: {
      derived: "'{{name}}' derives state inside an effect. Compute it during render instead.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'useEffect') return;
        const statement = singleStatement(node.arguments[0]);
        if (!statement || statement.type !== 'ExpressionStatement') return;
        const expr = statement.expression;
        if (expr.type === 'CallExpression' && expr.callee.type === 'Identifier' && SETTER.test(expr.callee.name)) {
          context.report({ node: expr, messageId: 'derived', data: { name: expr.callee.name } });
        }
      },
    };
  },
};
