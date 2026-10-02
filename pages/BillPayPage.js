// pages/BillPayPage.js
// ParaBank-specific Bill Pay Page Object Model.

'use strict';

const { BasePage } = require('./BasePage');

class BillPayPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.payeeName          = this.locator('input[name="payee.name"]');
    this.streetInput        = this.locator('input[name="payee.address.street"]');
    this.cityInput          = this.locator('input[name="payee.address.city"]');
    this.stateInput         = this.locator('input[name="payee.address.state"]');
    this.zipCodeInput       = this.locator('input[name="payee.address.zipCode"]');
    this.phoneInput         = this.locator('input[name="payee.phoneNumber"]');
    this.accountNumberInput = this.locator('input[name="payee.accountNumber"]');
    this.verifyAccountInput = this.locator('input[name="verifyAccount"]');
    this.amountInput        = this.locator('input[name="amount"]');
    this.fromAccountId      = this.locator('select[name="fromAccountId"]');
    this.sendPaymentButton  = this.locator('input[value="Send Payment"]');
    this.confirmationHeading = this.locator('#billpayResult h1.title');
    this.errorText          = this.locator('#rightPanel .error');
  }

  /** Navigate to the bill pay page. */
  async goto() {
    await this.navigate('billpay.htm');
  }

  /**
   * Fill the bill pay form and submit.
   * @param {{ name?, street?, city?, state?, zipCode?, phone?, accountNumber?, verifyAccount?, amount?, fromLabel? }} payee
   */
  async pay(payee = {}) {
    const fieldMap = {
      name:          this.payeeName,
      street:        this.streetInput,
      city:          this.cityInput,
      state:         this.stateInput,
      zipCode:       this.zipCodeInput,
      phone:         this.phoneInput,
      accountNumber: this.accountNumberInput,
      verifyAccount: this.verifyAccountInput,
      amount:        this.amountInput,
    };
    for (const [key, locator] of Object.entries(fieldMap)) {
      if (payee[key] !== undefined) await this.fill(locator, String(payee[key]));
    }
    if (payee.fromLabel) {
      const opts = await this.fromAccountId.locator('option').allTextContents();
      if (opts.some((o) => o.includes(payee.fromLabel))) {
        await this.fromAccountId.selectOption({ label: payee.fromLabel });
      }
    }
    await this.click(this.sendPaymentButton);
  }
}

module.exports = { BillPayPage };