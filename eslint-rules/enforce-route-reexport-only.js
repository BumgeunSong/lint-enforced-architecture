/**
 * enforce-route-reexport-only
 *
 * A route entry file (anything under a `routes/` folder) is only an entry point.
 * It may re-export from the feature, and nothing else: no component bodies,
 * no business logic, no JSX. The real code lives in src/app.
 *
 * Keeping route files thin means the routing layer stays a pure index that you
 * can read top to bottom in seconds.
 */
import { toPosix } from './_utils.js';

function isReexport(node) {
  // export { X } from '...'   /   export * from '...'
  if (node.type === 'ExportNamedDeclaration') return node.source != null && node.declaration == null;
  if (node.type === 'ExportAllDeclaration') return true;
  // export { default } style default re-export of an imported identifier
  if (node.type === 'ExportDefaultDeclaration') return node.declaration.type === 'Identifier';
  return false;
}

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Allow only re-exports inside route entry files.' },
    schema: [],
    messages: {
      routeBody: 'Route entry files may only re-export. Move this declaration into the feature (src/app).',
    },
  },
  create(context) {
    if (!/\/routes\//.test(toPosix(context.filename))) return {};

    return {
      Program(node) {
        for (const statement of node.body) {
          if (statement.type === 'ImportDeclaration') continue;
          if (isReexport(statement)) continue;
          context.report({ node: statement, messageId: 'routeBody' });
        }
      },
    };
  },
};
