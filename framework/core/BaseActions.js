// framework/core/BaseActions.js
// ─────────────────────────────────────────────────────────────────────────────
// PROJECT-AGNOSTIC Playwright interaction wrapper.
// This class knows HOW to interact with a browser — never WHAT to interact with.
// All Page Object Models must extend this class instead of referencing Playwright directly.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { expect } = require('@playwright/test');
const Logger = require('../utils/Logger');

class BaseActions {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  /**
   * Navigate to a URL (absolute or relative to baseURL configured on the context).
   * @param {string} url
   */
  async navigate(url) {
    Logger.debug(`[BaseActions] navigate → ${url}`);
    await this.page.goto(url);
  }

  /** Navigate to the baseURL root. */
  async navigateHome() {
    await this.navigate('index.htm');
  }

  /** Return the current full URL of the page. */
  getURL() {
    return this.page.url();
  }

  // ── Interactions ─────────────────────────────────────────────────────────────

  /**
   * Click an element by CSS selector or Playwright Locator.
   * @param {string|import('@playwright/test').Locator} selector
   * @param {{ timeout?: number }} [options]
   */
  async click(selector, options = {}) {
    Logger.debug(`[BaseActions] click → ${selector}`);
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.click(options);
  }

  /**
   * Fill an input field.
   * @param {string|import('@playwright/test').Locator} selector
   * @param {string} value
   */
  async fill(selector, value) {
    Logger.debug(`[BaseActions] fill → ${selector} = "${value}"`);
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.fill(value ?? '');
  }

  /**
   * Select an option in a <select> element by value.
   * @param {string|import('@playwright/test').Locator} selector
   * @param {string} value
   */
  async selectOption(selector, value) {
    Logger.debug(`[BaseActions] selectOption → ${selector} = "${value}"`);
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.selectOption(value);
  }

  /**
   * Set viewport size.
   * @param {number} width
   * @param {number} height
   */
  async setViewportSize(width, height) {
    Logger.debug(`[BaseActions] setViewportSize → ${width}x${height}`);
    await this.page.setViewportSize({ width, height });
  }

  /**
   * Register a one-time dialog (alert/confirm/prompt) handler.
   * @param {(dialog: import('@playwright/test').Dialog) => void} handler
   */
  onDialog(handler) {
    this.page.on('dialog', handler);
  }

  // ── Reading ──────────────────────────────────────────────────────────────────

  /**
   * Get the trimmed inner text of a selector.
   * @param {string|import('@playwright/test').Locator} selector
   * @param {{ timeout?: number }} [options]
   * @returns {Promise<string>}
   */
  async getText(selector, options = {}) {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    const text = await locator.innerText(options);
    return (text ?? '').trim();
  }

  /**
   * Get the trimmed text content (including hidden elements) of a selector.
   * @param {string|import('@playwright/test').Locator} selector
   * @returns {Promise<string>}
   */
  async getTextContent(selector) {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    const text = await locator.textContent();
    return (text ?? '').trim();
  }

  /**
   * Get an attribute value from a selector.
   * @param {string|import('@playwright/test').Locator} selector
   * @param {string} attribute
   * @returns {Promise<string|null>}
   */
  async getAttribute(selector, attribute) {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    return locator.getAttribute(attribute);
  }

  /**
   * Get the current value of an input element.
   * @param {string|import('@playwright/test').Locator} selector
   * @returns {Promise<string>}
   */
  async getInputValue(selector) {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    return locator.inputValue();
  }

  /**
   * Get the full body text of the page.
   * @returns {Promise<string>}
   */
  async getBodyText() {
    return this.page.locator('body').innerText();
  }

  /**
   * Get the page <title>.
   * @returns {Promise<string>}
   */
  async getTitle() {
    return this.page.title();
  }

  /**
   * Count the number of elements matching a selector.
   * @param {string|import('@playwright/test').Locator} selector
   * @returns {Promise<number>}
   */
  async count(selector) {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    return locator.count();
  }

  /**
   * Execute arbitrary JavaScript in the page context.
   * @param {Function} fn
   * @returns {Promise<any>}
   */
  async evaluate(fn) {
    return this.page.evaluate(fn);
  }

  // ── Visibility ───────────────────────────────────────────────────────────────

  /**
   * Returns true if the selector is currently visible.
   * @param {string|import('@playwright/test').Locator} selector
   * @returns {Promise<boolean>}
   */
  async isVisible(selector) {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    return locator.isVisible();
  }

  // ── Waiting ──────────────────────────────────────────────────────────────────

  /**
   * Wait for a selector to become visible.
   * @param {string|import('@playwright/test').Locator} selector
   * @param {number} [timeout=20000]
   */
  async waitForVisible(selector, timeout = 20000) {
    Logger.debug(`[BaseActions] waitForVisible → ${selector} (timeout: ${timeout}ms)`);
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait a fixed number of milliseconds.
   * @param {number} ms
   */
  async waitForTimeout(ms) {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Wait for navigation to complete after an action.
   * @param {{ timeout?: number }} [options]
   */
  async waitForNavigation(options = {}) {
    await this.page.waitForNavigation(options);
  }

  // ── Playwright Assertions (wrapped) ─────────────────────────────────────────

  /**
   * Assert a locator is visible.
   * @param {string|import('@playwright/test').Locator} selector
   * @param {{ timeout?: number }} [options]
   */
  async expectVisible(selector, options = {}) {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await expect(locator).toBeVisible({ timeout: options.timeout ?? 20000 });
  }

  /**
   * Assert an element contains text.
   * @param {string|import('@playwright/test').Locator} selector
   * @param {string|RegExp} text
   * @param {{ timeout?: number }} [options]
   */
  async expectText(selector, text, options = {}) {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await expect(locator).toContainText(text, { timeout: options.timeout ?? 20000 });
  }

  /**
   * Assert the page title matches a pattern.
   * @param {string|RegExp} pattern
   * @param {{ timeout?: number }} [options]
   */
  async expectTitle(pattern, options = {}) {
    await expect(this.page).toHaveTitle(pattern, { timeout: options.timeout ?? 10000 });
  }

  /**
   * Assert the count of elements matching a selector.
   * @param {string|import('@playwright/test').Locator} selector
   * @param {number} count
   */
  async expectCount(selector, count) {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await expect(locator).toHaveCount(count);
  }

  /**
   * Assert an input's current value.
   * @param {string|import('@playwright/test').Locator} selector
   * @param {string} value
   */
  async expectInputValue(selector, value) {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await expect(locator).toHaveValue(value);
  }

  // ── Universal Multi-Website Workflow Helpers ─────────────────────────────────

  /**
   * Generic login helper that works on ANY website.
   * Pass the target URL, selectors for username, password, submit button, and credentials.
   * @param {{ url?: string, usernameSelector: string, passwordSelector: string, submitSelector: string, username: string, password: string }} options
   */
  async performLogin(options) {
    const { url, usernameSelector, passwordSelector, submitSelector, username, password } = options;
    if (url) {
      await this.navigate(url);
    }
    Logger.info(`[BaseActions] Executing generic login for user: "${username}"`);
    await this.fill(usernameSelector, username);
    await this.fill(passwordSelector, password);
    await this.click(submitSelector);
  }

  /**
   * Generic form filler that works on ANY website.
   * Accepts a map of CSS selectors/locators to field values.
   * Example: { '#first_name': 'John', '#email': 'john@demo.com', '#city': 'NYC' }
   * @param {Record<string, string>} fieldMap
   */
  async fillForm(fieldMap) {
    Logger.info(`[BaseActions] Filling generic form with ${Object.keys(fieldMap).length} fields`);
    for (const [selector, value] of Object.entries(fieldMap)) {
      if (value !== undefined && value !== null) {
        await this.fill(selector, String(value));
      }
    }
  }

  /**
   * Generic HTML table scraper that extracts row/column text from ANY website.
   * @param {string} tableSelector
   * @returns {Promise<Array<Array<string>>>}
   */
  async getTableRows(tableSelector) {
    Logger.debug(`[BaseActions] Extracting table rows from: ${tableSelector}`);
    const rows = this.page.locator(`${tableSelector} tr`);
    const count = await rows.count();
    const result = [];
    for (let i = 0; i < count; i++) {
      const cells = await rows.nth(i).locator('th, td').allInnerTexts();
      if (cells.length > 0) {
        result.push(cells.map((c) => c.trim()));
      }
    }
    return result;
  }
  /**
   * Return a Playwright Locator. Use this in POM constructors to create stored locators.
   * @param {string} selector
   * @returns {import('@playwright/test').Locator}
   */
  locator(selector) {
    return this.page.locator(selector);
  }

  /**
   * Return a role-based locator.
   * @param {import('@playwright/test').AriaRole} role
   * @param {{ name?: string|RegExp, exact?: boolean }} [options]
   * @returns {import('@playwright/test').Locator}
   */
  getByRole(role, options) {
    return this.page.getByRole(role, options);
  }
}

module.exports = { BaseActions };
