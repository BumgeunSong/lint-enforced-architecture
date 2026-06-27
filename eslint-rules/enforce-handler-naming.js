/**
 * enforce-handler-naming
 *
 * Naming splits the two sides of an event callback:
 *   - a Props callback crossing the boundary is named `on*`   (onSubmit)
 *   - the internal handler that implements it is named `handle*` (handleSubmit)
 *
 * So a function-typed member of a `*Props` type must start with `on`, never
 * `handle`. The name alone then tells you which side of the boundary you are on.
 */
function isFunctionType(member) {
  const annotation = member.typeAnnotation?.typeAnnotation;
  return annotation?.type === 'TSFunctionType';
}

function memberName(member) {
  return member.key?.type === 'Identifier' ? member.key.name : null;
}

function checkMembers(context, members) {
  for (const member of members) {
    if (member.type !== 'TSPropertySignature') continue;
    if (!isFunctionType(member)) continue;
    const name = memberName(member);
    if (name == null) continue;
    if (name.startsWith('on')) continue;
    context.report({ node: member, messageId: 'onPrefix', data: { name } });
  }
}

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Require function-typed members of a *Props type to use the on* prefix.' },
    schema: [],
    messages: {
      onPrefix: "Props callback '{{name}}' must start with 'on' (use 'handle*' only for the internal implementation).",
    },
  },
  create(context) {
    function isProps(name) {
      return typeof name === 'string' && name.endsWith('Props');
    }
    return {
      TSInterfaceDeclaration(node) {
        if (isProps(node.id?.name)) checkMembers(context, node.body.body);
      },
      TSTypeAliasDeclaration(node) {
        if (isProps(node.id?.name) && node.typeAnnotation.type === 'TSTypeLiteral') {
          checkMembers(context, node.typeAnnotation.members);
        }
      },
    };
  },
};
