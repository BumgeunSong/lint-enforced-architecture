/**
 * enforce-model-fn-to-prefix   [dependent half of compounding pair #2]
 *
 * In a `*.model.ts` file every exported function is a data transform, so it is
 * named `to{Something}` (toUserModel, toOrderSummary). The `to` prefix makes the
 * "this maps raw data into a model" intent obvious at the call site.
 *
 * This rule keys off the `.model.ts` suffix alone, which enforce-file-suffix
 * guarantees. The filename convention is the scaffold; this content rule is the
 * cheap thing you stack on top.
 */
import { toPosix } from './_utils.js';

const TO_PREFIX = /^to[A-Z]/;

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Require exported functions in *.model.ts to use the to* prefix.' },
    schema: [],
    messages: {
      toPrefix: "Model transform '{{name}}' must start with 'to' (e.g. 'to{{Pascal}}').",
    },
  },
  create(context) {
    if (!/\.model\.ts$/.test(toPosix(context.filename))) return {};

    function check(node, name) {
      if (name == null || TO_PREFIX.test(name)) return;
      const pascal = name.charAt(0).toUpperCase() + name.slice(1);
      context.report({ node, messageId: 'toPrefix', data: { name, Pascal: pascal } });
    }

    return {
      ExportNamedDeclaration(node) {
        const decl = node.declaration;
        if (decl == null) return;
        if (decl.type === 'FunctionDeclaration') {
          check(decl, decl.id?.name);
        } else if (decl.type === 'VariableDeclaration') {
          for (const d of decl.declarations) {
            const init = d.init;
            if (init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')) {
              check(d, d.id.type === 'Identifier' ? d.id.name : null);
            }
          }
        }
      },
    };
  },
};
