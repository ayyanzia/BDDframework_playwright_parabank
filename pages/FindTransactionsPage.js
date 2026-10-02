// pages/FindTransactionsPage.js
// ParaBank-specific Find Transactions Page Object Model.

'use strict';

const { BasePage } = require('./BasePage');

class FindTransactionsPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.transactionIdInput = this.locator('#transactionId');
    this.dateInput          = this.locator('#transactionDate');
    this.fromDateInput      = this.locator('#fromDate');
    this.toDateInput        = this.locator('#toDate');
    this.amountInput        = this.locator('#amount');
    this.resultsTable       = this.locator('#transactionTable');
    this.resultsRows        = this.locator('#transactionTable tbody tr');
    this.errorText          = this.locator('#rightPanel .error, #transactionTable + .error');
    this.findButtons        = this.page.getByRole('button', { name: 'Find Transactions' });
  }

  /**
   * Navigate to the find transactions page.
   * @param {string} [accountId] - Optional account ID to pre-select.
   */
  async goto(accountId) {
    const url = accountId ? `/findtrans.htm?id=${accountId}` : 'findtrans.htm';
    await this.navigate(url);
  }

  /** Search by transaction ID. */
  async findByTransactionId(id) {
    await this.fill(this.transactionIdInput, String(id));
    await this.click(this.findButtons.nth(0));
  }

  /** Search by exact date (MM-DD-YYYY). */
  async findByDate(date) {
    await this.fill(this.dateInput, date);
    await this.click(this.findButtons.nth(1));
  }

  /** Search by date range. */
  async findByDateRange(fromDate, toDate) {
    await this.fill(this.fromDateInput, fromDate);
    await this.fill(this.toDateInput, toDate);
    await this.click(this.findButtons.nth(2));
  }

  /** Search by dollar amount. */
  async findByAmount(amount) {
    await this.fill(this.amountInput, String(amount));
    await this.click(this.findButtons.nth(3));
  }
}

module.exports = { FindTransactionsPage };