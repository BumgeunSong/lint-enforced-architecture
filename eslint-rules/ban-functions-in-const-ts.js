/**
 * ban-functions-in-const-ts   [second dependent of the .const.ts scaffold]
 *
 * A `*.const.ts` file holds literal values only — no function definitions. If you
 * need logic, it belongs in a model or a util, not in the constants file.
 *
 * Like enforce-model-fn-to-prefix, this leans entirely on the `.const.ts` suffix
 * that enforce-file-suffix guarantees: the filename is the only thing this rule
 * needs to know to do its job.
 */
import { toPosix } from './_utils.js';

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Forbid function definitions in *.const.ts files.' },
    schema: [],
    messages: {
      noFunction: 'A *.const.ts file holds literal values only. Move this function to a model or util.',
    },
  },
  create(context) {
    if (!/\.const\.ts$/.test(toPosix(context.filename))) return {};

    return {
      FunctionDeclaration(node) {
        context.report({ node, messageId: 'noFunction' });
      },
      VariableDeclarator(node) {
        const init = node.init;
        if (init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')) {
          context.report({ node: init, messageId: 'noFunction' });
        }
      },
    };
  },
};
