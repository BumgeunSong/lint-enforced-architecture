/**
 * enforce-suspense-for-suspense-query   [dependent half of compounding pair #1]
 *
 * A `...SuspenseQuery` hook suspends while it loads, so a <Suspense> boundary
 * must exist above it. As a deterministic file-level gate: if a file calls any
 * `*SuspenseQuery` hook, that file must also import `Suspense` from 'react'.
 *
 * This rule only works because enforce-query-hook-suffix already guarantees the
 * name. Without that foothold, "which call is a suspense hook?" would itself be
 * the hard problem. This is the multiplication the article talks about: a cheap
 * naming rule turns an otherwise-tricky structural rule into a few lines.
 */
const SUSPENSE_QUERY_HOOK = /SuspenseQuery$/;

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Require a Suspense import in any file that calls a *SuspenseQuery hook.' },
    schema: [],
    messages: {
      missingSuspense:
        "'{{name}}' suspends while loading, but this file does not import Suspense. Wrap it in a <Suspense> boundary.",
    },
  },
  create(context) {
    let importsSuspense = false;
    const suspenseCalls = [];

    return {
      ImportDeclaration(node) {
        if (node.source.value !== 'react') return;
        for (const spec of node.specifiers) {
          if (spec.type === 'ImportSpecifier' && spec.imported.name === 'Suspense') importsSuspense = true;
        }
      },
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && SUSPENSE_QUERY_HOOK.test(node.callee.name)) {
          suspenseCalls.push(node.callee);
        }
      },
      'Program:exit'() {
        if (importsSuspense) return;
        for (const callee of suspenseCalls) {
          context.report({ node: callee, messageId: 'missingSuspense', data: { name: callee.name } });
        }
      },
    };
  },
};
