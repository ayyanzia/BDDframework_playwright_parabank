// pages/OpenAccountPage.js
// ParaBank-specific Open Account Page Object Model.

'use strict';

const { BasePage } = require('./BasePage');

class OpenAccountPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.accountTypeSelect  = this.locator('#type');
    this.fromAccountId      = this.locator('#fromAccountId');
    this.openAccountButton  = this.locator('input[value="Open New Account"]');
    this.newAccountId       = this.locator('#newAccountId');
    this.successHeading     = this.locator('#openAccountResult h1.title, #rightPanel h1.title');
  }

  /** Navigate to the open account page. */
  async goto() {
    await this.navigate('openaccount.htm');
  }

  /**
   * Select account type and submit.
   * @param {{ type?: string, fromAccountLabel?: string }} options
   */
  async openNewAccount({ type = 'CHECKING', fromAccountLabel } = {}) {
    const typeOptions = await this.accountTypeSelect.locator('option').allTextContents();
    if (typeOptions.some((o) => o.includes(type))) {
      await this.accountTypeSelect.selectOption({ label: type });
    }
    if (fromAccountLabel) {
      await this.fromAccountId.selectOption({ label: fromAccountLabel });
    }
    await this.click(this.openAccountButton);
  }

  /**
   * Get all available source account options.
   * @returns {Promise<string[]>}
   */
  async availableFromAccounts() {
    return this.fromAccountId.locator('option').allTextContents();
  }
}

module.exports = { OpenAccountPage };