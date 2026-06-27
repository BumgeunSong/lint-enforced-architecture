/**
 * ban-sideeffect-in-component
 *
 * The other half of the components/containers split: a presentation component
 * must not trigger navigation directly. It raises an `on*` callback and lets the
 * container decide where to go.
 *
 * Banning `navigate(...)` inside components/ keeps side effects in one layer,
 * where they are easy to find and test.
 */
import { toPosix } from './_utils.js';

const SIDE_EFFECT_CALLS = new Set(['navigate']);

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Forbid navigation side effects inside presentation components.' },
    schema: [],
    messages: {
      sideEffect:
        "'{{name}}(...)' is a side effect and belongs in a container. Raise an on* callback prop instead.",
    },
  },
  create(context) {
    if (!/\/components\//.test(toPosix(context.filename))) return {};

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type === 'Identifier' && SIDE_EFFECT_CALLS.has(callee.name)) {
          context.report({ node: callee, messageId: 'sideEffect', data: { name: callee.name } });
        }
      },
    };
  },
};
