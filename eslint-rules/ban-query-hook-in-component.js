/**
 * ban-query-hook-in-component
 *
 * Files under a `components/` folder are pure presentation. Data fetching is a
 * container concern. So calling any `use*Query` hook from a component is banned.
 *
 * This is one half of the components/containers split: components render props,
 * containers decide what those props are.
 */
import { toPosix } from './_utils.js';

const QUERY_HOOK = /^use[A-Z].*Query$/;

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Forbid data-fetching query hooks inside presentation components.' },
    schema: [],
    messages: {
      queryInComponent:
        "'{{name}}' is a data hook and must live in a container, not a component. Pass the data in as props.",
    },
  },
  create(context) {
    if (!/\/components\//.test(toPosix(context.filename))) return {};

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type === 'Identifier' && QUERY_HOOK.test(callee.name)) {
          context.report({ node: callee, messageId: 'queryInComponent', data: { name: callee.name } });
        }
      },
    };
  },
};
