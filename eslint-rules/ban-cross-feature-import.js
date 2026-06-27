/**
 * ban-cross-feature-import
 *
 * Inside src/app, one feature may not reach into another feature's internals.
 * Cross-feature sharing must go through a neutral place: `app/common` or `shared`.
 *
 * This keeps features as independently understandable units instead of a web
 * of point-to-point couplings that nobody can safely delete.
 */
import { featureOfPath, featureOfImport } from './_utils.js';

const NEUTRAL_FEATURES = new Set(['common']);

export default {
  meta: {
    type: 'problem',
    docs: { description: "Forbid a feature from importing another feature's internals." },
    schema: [],
    messages: {
      crossFeature:
        "Feature '{{from}}' must not import internals of feature '{{to}}'. Route shared code through 'app/common' or 'shared'.",
    },
  },
  create(context) {
    const fromFeature = featureOfPath(context.filename);
    if (fromFeature == null) return {};

    return {
      ImportDeclaration(node) {
        const toFeature = featureOfImport(node.source.value);
        if (toFeature == null) return;
        if (toFeature === fromFeature) return;
        if (NEUTRAL_FEATURES.has(toFeature)) return;
        context.report({ node, messageId: 'crossFeature', data: { from: fromFeature, to: toFeature } });
      },
    };
  },
};
