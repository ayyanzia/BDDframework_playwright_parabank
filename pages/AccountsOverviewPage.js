// pages/AccountsOverviewPage.js
// ParaBank-specific Accounts Overview Page Object Model.

'use strict';

const { BasePage } = require('./BasePage');

class AccountsOverviewPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.accountTable = this.locator('#accountTable');
    this.accountRows  = this.locator('#accountTable tbody tr');
    this.totalCell    = this.locator('#accountTable tfoot td').nth(1);
  }

  /** Navigate to the accounts overview page. */
  async goto() {
    await this.navigate('overview.htm');
  }

  /**
   * Parse all account rows into objects.
   * @returns {Promise<Array<{ accountNumber: string, balance: string, available: string }>>}
   */
  async readAccounts() {
    const rows = await this.accountRows.all();
    const out  = [];
    for (const row of rows) {
      const cells = await row.locator('td').allInnerTexts();
      if (cells.length >= 3) {
        out.push({
          accountNumber: cells[0].trim(),
          balance:       cells[1].trim(),
          available:     cells[2].trim(),
        });
      }
    }
    return out;
  }

  /**
   * Click an account number link in the table.
   * @param {string} accountNumber
   */
  async openAccount(accountNumber) {
    await this.click(this.locator('#accountTable a').filter({ hasText: accountNumber }));
  }
}

module.exports = { AccountsOverviewPage };