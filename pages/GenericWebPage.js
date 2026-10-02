// pages/GenericWebPage.js
// ─────────────────────────────────────────────────────────────────────────────
// Universal Multi-Website Page Object Model.
// Demonstrates how to test ANY website (SauceDemo, ParaBank, E-Commerce, SaaS)
// without creating a new framework.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { BaseActions, getSiteConfig } = require('../framework');

class GenericWebPage extends BaseActions {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} [siteKey] - 'parabank', 'saucedemo', 'customSite', or any key from siteConfig
   */
  constructor(page, siteKey) {
    super(page);
    this.siteConfig = siteKey ? getSiteConfig(siteKey) : null;
  }

  /**
   * Universal Login method for any website.
   * If siteKey was provided in constructor, uses configured selectors.
   * Or pass custom selectors directly.
   * @param {string} username
   * @param {string} password
   * @param {{ usernameSelector?: string, passwordSelector?: string, submitSelector?: string, url?: string }} [customSelectors]
   */
  async loginToWebsite(username, password, customSelectors = {}) {
    const loginConfig = this.siteConfig ? this.siteConfig.login : {};
    const url              = customSelectors.url || loginConfig.url || '';
    const usernameSelector = customSelectors.usernameSelector || loginConfig.usernameSelector || '#username';
    const passwordSelector = customSelectors.passwordSelector || loginConfig.passwordSelector || '#password';
    const submitSelector   = customSelectors.submitSelector || loginConfig.submitSelector || 'button[type="submit"]';

    if (url && this.siteConfig) {
      const fullUrl = this.siteConfig.baseUrl + url;
      await this.navigate(fullUrl);
    }

    await this.performLogin({
      usernameSelector,
      passwordSelector,
      submitSelector,
      username,
      password,
    });
  }

  /**
   * Universal Form Filler for any page or registration form.
   * Pass an object mapping field selectors to values.
   * @param {Record<string, string>} formData
   */
  async fillGenericForm(formData) {
    await this.fillForm(formData);
  }

  /**
   * Universal Data Table Reader for any web page containing a table.
   * @param {string} [tableCssSelector='table']
   */
  async readTableData(tableCssSelector = 'table') {
    return await this.getTableRows(tableCssSelector);
  }
}

module.exports = { GenericWebPage };
