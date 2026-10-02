// pages/TransferFundsPage.js
// ParaBank-specific Transfer Funds Page Object Model.

'use strict';

const { BasePage } = require('./BasePage');

class TransferFundsPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.amountInput          = this.locator('#amount');
    this.fromAccountId        = this.locator('#fromAccountId');
    this.toAccountId          = this.locator('#toAccountId');
    this.transferButton       = this.locator('input[value="Transfer"]');
    this.confirmationHeading  = this.locator('#showResult h1.title');
    this.errorText            = this.locator('#rightPanel .error');
  }

  /** Navigate to the transfer funds page. */
  async goto() {
    await this.navigate('transfer.htm');
  }

  /**
   * Fill transfer details and submit.
   * @param {{ amount?: string|number, fromLabel?: string, toLabel?: string }} options
   */
  async transfer({ amount, fromLabel, toLabel } = {}) {
    if (amount !== undefined) await this.fill(this.amountInput, String(amount));
    if (fromLabel) await this.fromAccountId.selectOption({ label: fromLabel });
    if (toLabel)   await this.toAccountId.selectOption({ label: toLabel });
    await this.click(this.transferButton);
  }

  /**
   * Get all available account options from the source dropdown.
   * @returns {Promise<string[]>}
   */
  async accountOptions() {
    return this.fromAccountId.locator('option').allTextContents();
  }
}

module.exports = { TransferFundsPage };