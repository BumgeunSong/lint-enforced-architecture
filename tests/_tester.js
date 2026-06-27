/**
 * Shared RuleTester wired to the TypeScript parser and vitest.
 *
 * The `valid` / `invalid` fixtures in each test file are the executable spec for
 * a rule: they say exactly what it catches and what it leaves alone. When the
 * article talks about reading a rule's intent from its invalid fixtures, this is
 * the file it means.
 */
import { RuleTester } from 'eslint';
import { afterAll, describe, it } from 'vitest';
import tsParser from '@typescript-eslint/parser';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

export function makeTester() {
  return new RuleTester({
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  });
}
