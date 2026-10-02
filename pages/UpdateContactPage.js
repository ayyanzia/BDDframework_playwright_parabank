// pages/UpdateContactPage.js
// ParaBank-specific Update Contact Info Page Object Model.

'use strict';

const { BasePage } = require('./BasePage');

class UpdateContactPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.firstNameInput       = this.locator('input[name="customer.firstName"]');
    this.lastNameInput        = this.locator('input[name="customer.lastName"]');
    this.streetInput          = this.locator('input[name="customer.address.street"]');
    this.cityInput            = this.locator('input[name="customer.address.city"]');
    this.stateInput           = this.locator('input[name="customer.address.state"]');
    this.zipCodeInput         = this.locator('input[name="customer.address.zipCode"]');
    this.phoneInput           = this.locator('input[name="customer.phoneNumber"]');
    this.updateButton         = this.locator('input[value="Update Profile"]');
    this.confirmationHeading  = this.locator('#updateProfileResult h1.title, #rightPanel h1.title').first();
    this.fieldErrors          = this.locator('#updateProfileForm .error, #updateProfileForm span.error');
  }

  /** Navigate to the update contact info page. */
  async goto() {
    await this.navigate('updateprofile.htm');
  }

  /**
   * Update one or more contact fields and submit.
   * @param {{ firstName?, lastName?, street?, city?, state?, zipCode?, phone? }} profile
   */
  async update(profile = {}) {
    const fieldMap = {
      firstName: this.firstNameInput,
      lastName:  this.lastNameInput,
      street:    this.streetInput,
      city:      this.cityInput,
      state:     this.stateInput,
      zipCode:   this.zipCodeInput,
      phone:     this.phoneInput,
    };
    for (const [key, locator] of Object.entries(fieldMap)) {
      if (profile[key] !== undefined) {
        await this.fill(locator, ''); // clear first
        await this.fill(locator, String(profile[key]));
      }
    }
    await this.click(this.updateButton);
  }
}

module.exports = { UpdateContactPage };