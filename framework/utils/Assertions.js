// framework/utils/Assertions.js
// ─────────────────────────────────────────────────────────────────────────────
// PROJECT-AGNOSTIC custom assertion helpers.
// Wraps Playwright's expect() with descriptive failure labels so test output
// pinpoints exactly which assertion failed and why.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { expect } = require('@playwright/test');
const Logger     = require('./Logger');

const Assertions = {
  /**
   * Assert a locator is visible on the page.
   * @param {import('@playwright/test').Locator} locator
   * @param {string} [label] - Human-readable label for error messages.
   * @param {number} [timeout=20000]
   */
  async assertVisible(locator, label = 'element', timeout = 20000) {
    Logger.debug(`[Assert] assertVisible: ${label}`);
    await expect(locator, `Expected "${label}" to be visible`).toBeVisible({ timeout });
  },

  /**
   * Assert an element has exactly the given text.
   * @param {import('@playwright/test').Locator} locator
   * @param {string} expected
   * @param {string} [label]
   */
  async assertText(locator, expected, label = 'element') {
    Logger.debug(`[Assert] assertText: ${label} = "${expected}"`);
    await expect(locator, `Expected "${label}" to have text "${expected}"`).toHaveText(expected);
  },

  /**
   * Assert an element contains the given substring.
   * @param {import('@playwright/test').Locator} locator
   * @param {string|RegExp} expected
   * @param {string} [label]
   * @param {number} [timeout=20000]
   */
  async assertContainsText(locator, expected, label = 'element', timeout = 20000) {
    Logger.debug(`[Assert] assertContainsText: ${label} ⊇ "${expected}"`);
    await expect(locator, `Expected "${label}" to contain "${expected}"`).toContainText(expected, { timeout });
  },

  /**
   * Assert the count of elements matching a locator.
   * @param {import('@playwright/test').Locator} locator
   * @param {number} count
   * @param {string} [label]
   */
  async assertCount(locator, count, label = 'elements') {
    Logger.debug(`[Assert] assertCount: ${label} = ${count}`);
    await expect(locator, `Expected count of "${label}" to be ${count}`).toHaveCount(count);
  },

  /**
   * Assert the count of elements is greater than zero.
   * @param {import('@playwright/test').Locator} locator
   * @param {string} [label]
   */
  async assertAtLeastOne(locator, label = 'element') {
    Logger.debug(`[Assert] assertAtLeastOne: ${label}`);
    const count = await locator.count();
    if (count < 1) {
      throw new Error(`[Assert] Expected at least one "${label}" but found 0`);
    }
  },

  /**
   * Assert the page title matches a string or regex.
   * @param {import('@playwright/test').Page} page
   * @param {string|RegExp} pattern
   * @param {string} [label]
   * @param {number} [timeout=10000]
   */
  async assertTitle(page, pattern, label = 'page title', timeout = 10000) {
    Logger.debug(`[Assert] assertTitle: "${label}" matches ${pattern}`);
    await expect(page, `Expected ${label} to match ${pattern}`).toHaveTitle(pattern, { timeout });
  },

  /**
   * Assert an input element has the expected value.
   * @param {import('@playwright/test').Locator} locator
   * @param {string} expected
   * @param {string} [label]
   */
  async assertInputValue(locator, expected, label = 'input') {
    Logger.debug(`[Assert] assertInputValue: ${label} = "${expected}"`);
    await expect(locator, `Expected "${label}" value to be "${expected}"`).toHaveValue(expected);
  },

  /**
   * Assert body text does NOT contain a forbidden string.
   * @param {import('@playwright/test').Locator} locator
   * @param {string} forbidden
   * @param {string} [label]
   */
  async assertNotContainsText(locator, forbidden, label = 'element') {
    Logger.debug(`[Assert] assertNotContainsText: ${label} ⊉ "${forbidden}"`);
    const text = await locator.innerText();
    if (text.includes(forbidden)) {
      throw new Error(`[Assert] "${label}" must NOT contain "${forbidden}", but it did.`);
    }
  },

  /**
   * Assert that a condition is truthy with a descriptive message.
   * @param {boolean} condition
   * @param {string} message
   */
  assertTrue(condition, message) {
    Logger.debug(`[Assert] assertTrue: ${message}`);
    if (!condition) {
      throw new Error(`[Assert] Expected truthy condition: ${message}`);
    }
  },

  /**
   * Assert a string or body of text contains one of multiple alternatives.
   * @param {string} text
   * @param {string[]} alternatives
   * @param {string} [label]
   */
  assertContainsAny(text, alternatives, label = 'text') {
    Logger.debug(`[Assert] assertContainsAny: ${label}`);
    const matched = alternatives.some((a) => text.includes(a));
    if (!matched) {
      throw new Error(
        `[Assert] "${label}" did not contain any of: ${alternatives.map((a) => `"${a}"`).join(', ')}`
      );
    }
  },
};

module.exports = Assertions;
