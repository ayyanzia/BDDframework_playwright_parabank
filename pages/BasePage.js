// pages/BasePage.js
// ─────────────────────────────────────────────────────────────────────────────
// ParaBank-specific base class for all Page Object Models.
// Extends BaseActions (framework layer) so POMs never call Playwright directly.
// Adds ParaBank-specific shared selectors and helpers that every page needs.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { BaseActions } = require('../framework');

class BasePage extends BaseActions {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page); // BaseActions wraps this.page
    // ParaBank shared layout selectors
    this.leftNav    = page.locator('#leftPanel');
    this.rightPanel = page.locator('#rightPanel');
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  /** Navigate to the ParaBank home / login page. */
  async gotoHome() {
    await this.navigate('index.htm');
  }

  // ── ParaBank helpers ─────────────────────────────────────────────────────────

  /**
   * Click the Log Out link in the left navigation panel.
   * Guards against the case where already logged out.
   */
  async logout() {
    const link = this.leftNav.locator('a', { hasText: 'Log Out' });
    if (await link.count() > 0) {
      await link.click();
    }
  }

  /**
   * Return a left-nav anchor by visible text (exact match).
   * @param {string} text
   * @returns {import('@playwright/test').Locator}
   */
  navLink(text) {
    return this.leftNav.getByRole('link', { name: text, exact: true });
  }

  /**
   * Return the generic red error message box ParaBank renders inside #rightPanel.
   * @returns {import('@playwright/test').Locator}
   */
  errorMessage() {
    return this.page.locator('#rightPanel .error, #rightPanel p.error');
  }

  /**
   * Returns true if the user is currently logged in (Log Out link is present).
   * @returns {Promise<boolean>}
   */
  async isLoggedIn() {
    return (await this.leftNav.getByRole('link', { name: 'Log Out' }).count()) > 0;
  }
}

module.exports = { BasePage };