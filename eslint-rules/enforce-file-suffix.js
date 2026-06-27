/**
 * enforce-file-suffix
 *
 * The filename should announce the layer. Files in these folders must carry the
 * matching suffix:
 *   models/    -> *.model.ts
 *   constants/ -> *.const.ts
 *   api/       -> *.api.ts
 *
 * This is a scaffold rule. Once a `.const.ts` or `.model.ts` suffix is
 * guaranteed, other rules (ban-functions-in-const-ts, enforce-model-fn-to-prefix)
 * can key off the filename alone and stay simple. Naming first, harder rules second.
 */
import { folderOfPath, baseName, isTestFile, isIndexFile } from './_utils.js';

const FOLDER_SUFFIX = {
  models: '.model.ts',
  constants: '.const.ts',
  api: '.api.ts',
};

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Require a layer-revealing filename suffix for files in models/, constants/, api/.' },
    schema: [],
    messages: {
      suffix: "Files in '{{folder}}/' must end with '{{suffix}}'. Rename '{{name}}'.",
    },
  },
  create(context) {
    const filename = context.filename;
    if (isTestFile(filename) || isIndexFile(filename)) return {};

    const folder = folderOfPath(filename);
    const suffix = FOLDER_SUFFIX[folder];
    if (suffix == null) return {};

    const name = baseName(filename);
    if (name.endsWith(suffix)) return {};

    return {
      Program(node) {
        context.report({ node, messageId: 'suffix', data: { folder, suffix, name } });
      },
    };
  },
};
