/**
 * ban-reverse-dependency
 *
 * Enforces the dependency direction  app -> shared -> external.
 * A lower layer must never import a higher one:
 *   - shared/   may not import app/
 *   - external/ may not import app/ or shared/
 *
 * The compiler is perfectly happy with a reverse import; the architecture
 * is the thing that quietly rots. This rule makes the direction a hard gate.
 */
import { layerOfPath, layerOfImport, rankOf } from './_utils.js';

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Forbid imports that point against the layer direction (app -> shared -> external).' },
    schema: [],
    messages: {
      reverse:
        "'{{from}}' layer must not import the '{{to}}' layer. Allowed direction is app -> shared -> external.",
    },
  },
  create(context) {
    const fromLayer = layerOfPath(context.filename);
    if (fromLayer == null) return {};

    return {
      ImportDeclaration(node) {
        const toLayer = layerOfImport(node.source.value);
        if (toLayer == null) return;
        if (rankOf(toLayer) > rankOf(fromLayer)) {
          context.report({ node, messageId: 'reverse', data: { from: fromLayer, to: toLayer } });
        }
      },
    };
  },
};
