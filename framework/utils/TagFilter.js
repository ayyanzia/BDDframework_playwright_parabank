// framework/utils/TagFilter.js
// ─────────────────────────────────────────────────────────────────────────────
// PROJECT-AGNOSTIC BDD tag filter helper.
// Documents and provides utilities for the @smoke, @sanity, @regression,
// and @module:* tag taxonomy used across Cucumber feature files.
//
// Tag taxonomy:
//   @smoke      — Fastest critical-path checks (~5 scenarios). Run on every commit.
//   @sanity     — Broader build-health check (~15 scenarios). Run on PR/merge.
//   @regression — Full suite. Run on release or nightly.
//   @module:*   — Module-scoped: @module:login, @module:registration, etc.
//
// Usage in cucumber.js profiles:
//   cucumber-js --tags "@smoke"
//   cucumber-js --tags "@module:login"
//   cucumber-js --tags "@regression"
//
// Usage via npm scripts:
//   npm run test:bdd:smoke
//   npm run test:bdd:sanity
//   npm run test:bdd:regression
//   npm run test:bdd:module:login
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

/** All recognised tier tags in ascending scope order. */
const TIER_TAGS = ['@smoke', '@sanity', '@regression'];

/** All recognised module tags. */
const MODULE_TAGS = [
  '@module:login',
  '@module:registration',
  '@module:navigation',
  '@module:accounts-overview',
  '@module:open-account',
  '@module:transfer-funds',
  '@module:bill-pay',
  '@module:find-transactions',
  '@module:update-contact',
  '@module:request-loan',
  '@module:session',
  '@module:security',
  '@module:ui-usability',
];

const TagFilter = {
  /**
   * Read the TAGS environment variable and return it as a Cucumber tag expression.
   * Falls back to '@regression' (run everything) if not set.
   * @returns {string}
   */
  getTagExpression() {
    return process.env.TAGS ?? '@regression';
  },

  /** All valid tier tags. */
  tierTags: TIER_TAGS,

  /** All valid module tags. */
  moduleTags: MODULE_TAGS,

  /**
   * Validate that a given tag string is a recognised tag.
   * Useful for CI scripts that construct tag expressions dynamically.
   * @param {string} tag
   * @returns {boolean}
   */
  isValidTag(tag) {
    return [...TIER_TAGS, ...MODULE_TAGS].includes(tag);
  },

  /**
   * Return the npm script name for a given tag.
   * @param {string} tag - e.g. '@smoke' or '@module:login'
   * @returns {string} e.g. 'npm run test:bdd:smoke'
   */
  toNpmScript(tag) {
    if (tag === '@smoke')      return 'npm run test:bdd:smoke';
    if (tag === '@sanity')     return 'npm run test:bdd:sanity';
    if (tag === '@regression') return 'npm run test:bdd:regression';
    if (tag.startsWith('@module:')) {
      const mod = tag.replace('@module:', '');
      return `npm run test:bdd:module:${mod}`;
    }
    return `cucumber-js --tags "${tag}"`;
  },
};

module.exports = TagFilter;
