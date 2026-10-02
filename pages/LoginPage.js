// pages/LoginPage.js
// ParaBank-specific Login Page Object Model.
// Extends BasePage (which extends BaseActions from the framework layer).
// No direct Playwright calls — only framework methods and locators.

'use strict';

const { BasePage } = require('./BasePage');

class LoginPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    // Locator declarations use this.locator() from BaseActions — no raw page.locator()
    this.usernameInput  = this.locator('input[name="username"]');
    this.passwordInput  = this.locator('input[name="password"]');
    this.loginButton    = this.locator('input[value="Log In"]');
    this.forgotLoginLink = this.page.getByRole('link', { name: 'Forgot login info?' });
  }

  /** Navigate to the login page. */
  async goto() {
    await this.navigate('index.htm');
  }

  /**
   * Fill credentials and click Log In.
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    await this.fill(this.usernameInput, username ?? '');
    await this.fill(this.passwordInput, password ?? '');
    await this.click(this.loginButton);
  }
}

module.exports = { LoginPage };