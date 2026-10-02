// pages/RegistrationPage.js
// ParaBank-specific Registration Page Object Model.
// Extends BasePage (→ BaseActions from framework layer).
// No direct Playwright calls — all interactions via inherited BaseActions methods.

'use strict';

const { BasePage } = require('./BasePage');

class RegistrationPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.firstNameInput    = this.locator('input[name="customer.firstName"]');
    this.lastNameInput     = this.locator('input[name="customer.lastName"]');
    this.streetInput       = this.locator('input[name="customer.address.street"]');
    this.cityInput         = this.locator('input[name="customer.address.city"]');
    this.stateInput        = this.locator('input[name="customer.address.state"]');
    this.zipCodeInput      = this.locator('input[name="customer.address.zipCode"]');
    this.phoneInput        = this.locator('input[name="customer.phoneNumber"]');
    this.ssnInput          = this.locator('input[name="customer.ssn"]');
    this.usernameInput     = this.locator('input[name="customer.username"]');
    this.passwordInput     = this.locator('input[name="customer.password"]');
    this.confirmPwdInput   = this.locator('#repeatedPassword');
    this.registerButton    = this.locator('input[value="Register"]');
    this.fieldErrors       = this.locator('#customerForm .error, #customerForm span.error');
  }

  /** Navigate to the registration page. */
  async goto() {
    await this.navigate('register.htm');
  }

  /**
   * Fill whichever fields are present in the profile object.
   * Omitting a key leaves the field untouched — supports partial / negative-path tests.
   * @param {Partial<{ firstName, lastName, street, city, state, zipCode, phone, ssn, username, password, confirmPassword }>} profile
   */
  async fillForm(profile) {
    const fieldMap = {
      firstName: this.firstNameInput,
      lastName:  this.lastNameInput,
      street:    this.streetInput,
      city:      this.cityInput,
      state:     this.stateInput,
      zipCode:   this.zipCodeInput,
      phone:     this.phoneInput,
      ssn:       this.ssnInput,
      username:  this.usernameInput,
      password:  this.passwordInput,
    };
    for (const [key, locator] of Object.entries(fieldMap)) {
      if (profile[key] !== undefined) await this.fill(locator, String(profile[key]));
    }
    const confirm = profile.confirmPassword ?? profile.password;
    if (confirm !== undefined) await this.fill(this.confirmPwdInput, String(confirm));
  }

  /** Click the Register button. */
  async submit() {
    await this.click(this.registerButton);
  }

  /**
   * Fill all fields and submit the form.
   * @param {object} profile
   */
  async register(profile) {
    await this.fillForm(profile);
    await this.submit();
  }

  /** Locator for the welcome heading shown after successful registration. */
  welcomeHeading() {
    return this.locator('#rightPanel h1.title');
  }
}

module.exports = { RegistrationPage };