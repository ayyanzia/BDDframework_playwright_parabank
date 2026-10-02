// pages/RequestLoanPage.js
// ParaBank-specific Request Loan Page Object Model.

'use strict';

const { BasePage } = require('./BasePage');

class RequestLoanPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.amountInput      = this.locator('#amount');
    this.downPaymentInput = this.locator('#downPayment');
    this.fromAccountId    = this.locator('#fromAccountId');
    this.applyButton      = this.locator('input[value="Apply Now"]');
    // The loan decision renders inside an iframe on classic ParaBank.
    this.resultFrame      = this.page.frameLocator('#loanRequestResultPage');
  }

  /** Navigate to the request loan page. */
  async goto() {
    await this.navigate('requestloan.htm');
  }

  /**
   * Fill loan application fields and submit.
   * @param {{ amount?: string|number, downPayment?: string|number, fromLabel?: string }} options
   */
  async apply({ amount, downPayment, fromLabel } = {}) {
    if (amount !== undefined)      await this.fill(this.amountInput, String(amount));
    if (downPayment !== undefined)  await this.fill(this.downPaymentInput, String(downPayment));
    if (fromLabel)                  await this.fromAccountId.selectOption({ label: fromLabel });
    await this.click(this.applyButton);
  }

  /**
   * Read the loan decision text from the result iframe.
   * @returns {Promise<string>}
   */
  async decisionText() {
    await this.waitForTimeout(1000); // iframe renders asynchronously
    return this.resultFrame.locator('#loanStatus').innerText();
  }

  /**
   * Read the new account ID assigned if the loan was approved.
   * @returns {Promise<string>}
   */
  async newAccountId() {
    return this.resultFrame.locator('#newAccountId').innerText();
  }
}

module.exports = { RequestLoanPage };