/**
 * lint-enforced-architecture
 *
 * A single custom plugin, `architecture`, that bundles all 15 rules and exposes a
 * `recommended` flat config. Drop it into eslint.config.js to turn the whole set
 * into a deterministic gate. See README.md for the wiring and the per-rule story.
 */
import banReverseDependency from './eslint-rules/ban-reverse-dependency.js';
import banCrossFeatureImport from './eslint-rules/ban-cross-feature-import.js';
import enforceRouteReexportOnly from './eslint-rules/enforce-route-reexport-only.js';
import banQueryHookInComponent from './eslint-rules/ban-query-hook-in-component.js';
import banSideeffectInComponent from './eslint-rules/ban-sideeffect-in-component.js';
import enforceFileSuffix from './eslint-rules/enforce-file-suffix.js';
import enforceContainerNaming from './eslint-rules/enforce-container-naming.js';
import enforceHandlerNaming from './eslint-rules/enforce-handler-naming.js';
import enforceQueryHookSuffix from './eslint-rules/enforce-query-hook-suffix.js';
import enforceSuspenseForSuspenseQuery from './eslint-rules/enforce-suspense-for-suspense-query.js';
import enforceModelFnToPrefix from './eslint-rules/enforce-model-fn-to-prefix.js';
import requireLoadingOnMutation from './eslint-rules/require-loading-on-mutation.js';
import banDerivedStateInEffect from './eslint-rules/ban-derived-state-in-effect.js';
import banNonDeterministicInJsx from './eslint-rules/ban-non-deterministic-in-jsx.js';
import banFunctionsInConstTs from './eslint-rules/ban-functions-in-const-ts.js';

const rules = {
  'ban-reverse-dependency': banReverseDependency,
  'ban-cross-feature-import': banCrossFeatureImport,
  'enforce-route-reexport-only': enforceRouteReexportOnly,
  'ban-query-hook-in-component': banQueryHookInComponent,
  'ban-sideeffect-in-component': banSideeffectInComponent,
  'enforce-file-suffix': enforceFileSuffix,
  'enforce-container-naming': enforceContainerNaming,
  'enforce-handler-naming': enforceHandlerNaming,
  'enforce-query-hook-suffix': enforceQueryHookSuffix,
  'enforce-suspense-for-suspense-query': enforceSuspenseForSuspenseQuery,
  'enforce-model-fn-to-prefix': enforceModelFnToPrefix,
  'require-loading-on-mutation': requireLoadingOnMutation,
  'ban-derived-state-in-effect': banDerivedStateInEffect,
  'ban-non-deterministic-in-jsx': banNonDeterministicInJsx,
  'ban-functions-in-const-ts': banFunctionsInConstTs,
};

const plugin = {
  meta: { name: 'lint-enforced-architecture', version: '0.1.0' },
  rules,
};

plugin.configs = {
  recommended: {
    plugins: { architecture: plugin },
    rules: Object.fromEntries(Object.keys(rules).map((name) => [`architecture/${name}`, 'error'])),
  },
};

export default plugin;
export { rules };
