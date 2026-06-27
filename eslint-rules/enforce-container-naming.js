/**
 * enforce-container-naming
 *
 * A file living directly under `containers/` must be named `*Container.tsx`.
 * The name is the contract: anything ending in Container is the orchestration
 * layer for a screen.
 *
 * This is the scaffold for require-loading-on-mutation: because containers are
 * reliably identifiable by location + name, a later rule can confidently say
 * "every write call in here must be wrapped in a loading guard."
 */
import { folderOfPath, baseName, isTestFile, isIndexFile } from './_utils.js';

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Require files directly in containers/ to be named *Container.' },
    schema: [],
    messages: {
      containerName: "Files in 'containers/' must be named '*Container'. Rename '{{name}}'.",
    },
  },
  create(context) {
    const filename = context.filename;
    if (isTestFile(filename) || isIndexFile(filename)) return {};
    if (folderOfPath(filename) !== 'containers') return {};

    const name = baseName(filename);
    const stem = name.replace(/\.[tj]sx?$/, '');
    if (stem.endsWith('Container')) return {};

    return {
      Program(node) {
        context.report({ node, messageId: 'containerName', data: { name } });
      },
    };
  },
};
