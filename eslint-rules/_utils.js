/**
 * Shared path helpers for the architecture rules.
 *
 * The whole plugin assumes one layered layout:
 *
 *   src/
 *     app/        <- features, the top layer (may import shared + external)
 *       <Feature>/
 *         components/   <- pure presentation
 *         containers/   <- orchestration, data + side effects
 *         queries/      <- data-fetching hooks
 *         models/       <- pure data transforms (*.model.ts)
 *         constants/    <- literal values (*.const.ts)
 *     shared/     <- reusable building blocks (may import external only)
 *     external/   <- adapters to the outside world (imports nothing internal)
 *
 * Every rule reads the file path to decide which layer / folder it is in.
 * That is the cheap structural signal the harder rules build on top of.
 */

/** Normalize Windows separators so the matchers below stay simple. */
export function toPosix(filename) {
  return String(filename).replace(/\\/g, '/');
}

/** external < shared < app. A file may only import its own rank or lower. */
const LAYER_RANK = { external: 0, shared: 1, app: 2 };

/** Infer the layer of a file path, or null if it sits outside src/. */
export function layerOfPath(filename) {
  const path = toPosix(filename);
  const match = path.match(/(?:^|\/)src\/(app|shared|external)(?:\/|$)/);
  return match ? match[1] : null;
}

/** Infer the layer a bare import source points at, or null. */
export function layerOfImport(source) {
  const match = source.match(/(?:^|\/)(app|shared|external)(?:\/|$)/);
  return match ? match[1] : null;
}

export function rankOf(layer) {
  return LAYER_RANK[layer];
}

/** First path segment under src/app — the feature name. */
export function featureOfPath(filename) {
  const match = toPosix(filename).match(/(?:^|\/)src\/app\/([^/]+)/);
  return match ? match[1] : null;
}

/** First feature segment an `app/...` import points at. */
export function featureOfImport(source) {
  const match = source.match(/(?:^|\/)app\/([^/]+)/);
  return match ? match[1] : null;
}

/** The immediate folder a file lives in (components, containers, ...). */
export function folderOfPath(filename) {
  const segments = toPosix(filename).split('/');
  return segments[segments.length - 2] ?? null;
}

export function baseName(filename) {
  const segments = toPosix(filename).split('/');
  return segments[segments.length - 1] ?? '';
}

/** Test and barrel files are exempt from most naming rules. */
export function isTestFile(filename) {
  return /\.(test|spec|e2e)\.[tj]sx?$/.test(toPosix(filename));
}

export function isIndexFile(filename) {
  return /\/index\.[tj]sx?$/.test(toPosix(filename));
}
