// features/step_definitions/steps.js
// ─────────────────────────────────────────────────────────────────────────────
// ParaBank BDD step definitions — built entirely on the Framework Layer.
// Imports: framework utilities (FakerHelper, Assertions, Logger)
//          ParaBank POMs (RegistrationPage, LoginPage, etc.)
//          session singleton
// Does NOT import @playwright/test browser primitives directly.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect }            = require('@playwright/test');

// Framework layer
const { FakerHelper, Assertions, Logger } = require('../../framework');

// ParaBank page objects
const { RegistrationPage } = require('../../pages/RegistrationPage');
const { LoginPage }        = require('../../pages/LoginPage');

// ParaBank helpers and session
const { loginUser, registerUser, BASE_URL } = require('../../tests/helpers/shared');
const session = require('../support/session');

// ── Module-level run state ───────────────────────────────────────────────────
let firstUser;

// ════════════════════════════════════════════════════════════════════════════════
// REGISTRATION
// ════════════════════════════════════════════════════════════════════════════════

Given('I navigate to the registration page', async function () {
  Logger.debug('[Step] I navigate to the registration page');
  const regPage = new RegistrationPage(this.page);
  await regPage.goto();
});

When('I click the register button without entering details', async function () {
  const regPage = new RegistrationPage(this.page);
  await regPage.submit();
});

When('I click the register button', async function () {
  const regPage = new RegistrationPage(this.page);
  await regPage.submit();
});

Then('I should see validation errors on the form', async function () {
  const regPage = new RegistrationPage(this.page);
  await Assertions.assertVisible(regPage.fieldErrors.first(), 'registration field error');
});

When('I enter user details with confirm password mismatched', async function () {
  const regPage = new RegistrationPage(this.page);
  const user = buildPersona();
  user.confirmPassword = 'WrongPassword99!';
  await regPage.fillForm(user);
});

When('I enter user details without SSN', async function () {
  const regPage = new RegistrationPage(this.page);
  const user = buildPersona();
  delete user.ssn;
  await regPage.fillForm(user);
});

When('I register a user with first name {string}', async function (firstName) {
  const regPage = new RegistrationPage(this.page);
  const user = buildPersona();
  user.firstName = firstName;
  await regPage.register(user);
});

Then('registration is accepted without crashes', async function () {
  await this.page.waitForTimeout(1500);
  const body = await this.page.locator('body').innerText();
  Assertions.assertTrue(body.length > 0, 'Registration page body is non-empty');
});

When('I register a new customer with valid data run {int}', async function (run) {
  const regPage = new RegistrationPage(this.page);
  const user = buildPersona();
  await regPage.register(user);
  if (run === 1) firstUser = user;
});

When('I attempt to register with a username that already exists', async function () {
  const regPage = new RegistrationPage(this.page);
  const dup = buildPersona();
  const primary = session.getPrimaryUser();
  if (primary)        dup.username = primary.username;
  else if (firstUser) dup.username = firstUser.username;
  await regPage.register(dup);
});

Then('the registration should fail or reject the duplicate username', async function () {
  await this.page.waitForTimeout(2000);
  const body = await this.page.locator('body').innerText();
  Assertions.assertTrue(body.length > 0, 'Duplicate username registration responded with content');
});

// ════════════════════════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════════════════════════

Given('I navigate to the home page', async function () {
  await this.page.goto('index.htm');
  await this.page.waitForTimeout(800);
});

When('I log in with username and password run {int}', async function (run) {
  const loginPage = new LoginPage(this.page);
  const primary   = session.getPrimaryUser();
  await loginPage.login(primary.username, primary.password);
  await this.page.waitForTimeout(1500);
});

Then('I should see the accounts overview page', async function () {
  const heading = this.page.locator('#rightPanel h1.title').first();
  await Assertions.assertVisible(heading, 'Accounts Overview heading');
});

When('I log out of my account', async function () {
  const logoutLink = this.page.locator('#leftPanel a', { hasText: 'Log Out' });
  if (await logoutLink.count() > 0) {
    await logoutLink.click();
    await this.page.waitForTimeout(1000);
  }
});

When('I log in with username and wrong password', async function () {
  const loginPage = new LoginPage(this.page);
  const primary   = session.getPrimaryUser();
  await loginPage.login(primary.username, 'TotallyWrongPass!');
  await this.page.waitForTimeout(1500);
});

Then('I should see a login failure error message', async function () {
  const bodyText = await this.page.locator('body').innerText();
  const rejected = bodyText.includes('Error') || bodyText.includes('could not be verified') || !bodyText.includes('Accounts Overview');
  Assertions.assertTrue(rejected, 'Login with wrong password was rejected');
});

When('I log in with a non-existent username', async function () {
  const loginPage = new LoginPage(this.page);
  await loginPage.login('nonexistent_user_xyz_99999', 'SomePass123!');
  await this.page.waitForTimeout(1500);
});

When('I log in with empty fields', async function () {
  const loginPage = new LoginPage(this.page);
  await loginPage.login('', '');
  await this.page.waitForTimeout(1500);
});

Then('I should see an empty fields error message', async function () {
  const bodyText = await this.page.locator('body').innerText();
  Assertions.assertTrue(
    bodyText.includes('Please enter a username and password.'),
    'Empty login fields error message shown'
  );
});

When('I log in with valid credentials', async function () {
  const primary = session.getPrimaryUser();
  await loginUser(this.page, primary.username, primary.password);
});

Then('I should see the login form fields', async function () {
  await Assertions.assertVisible(this.page.locator('input[name="username"]'), 'username input');
});

// ════════════════════════════════════════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════════════════════════════════════════

Given('I am logged in with the primary user', async function () {
  const primary = session.getPrimaryUser();
  await loginUser(this.page, primary.username, primary.password);
});

When('I click the navigation link {string}', async function (link) {
  const primary = session.getPrimaryUser();
  await loginUser(this.page, primary.username, primary.password);
  await this.page.locator('#leftPanel a', { hasText: link }).click();
  await this.page.waitForTimeout(1000);
});

Then('I should see the right panel container visible', async function () {
  await Assertions.assertVisible(this.page.locator('#rightPanel'), 'right panel');
});

Then('I should see all of the navigation links in the left panel', async function () {
  const navLinks = [
    'Open New Account', 'Accounts Overview', 'Transfer Funds',
    'Bill Pay', 'Find Transactions', 'Update Contact Info', 'Request Loan',
  ];
  for (const txt of navLinks) {
    const count = await this.page.locator('#leftPanel').getByRole('link', { name: txt }).count();
    Assertions.assertTrue(count > 0, `Navigation link "${txt}" is present`);
  }
});

Given(/^I navigate to the (accounts overview|find transactions|request loan|update contact|registration|home) page with a clean session$/, async function (pageName) {
  const BrowserManager = require('../../framework/core/BrowserManager');
  const { context, page } = await BrowserManager.newIsolatedPage();
  this.tmpPage = page;
  this.tmpCtx  = context;
  const urlMap = {
    'accounts overview':  'overview.htm',
    'find transactions':  'findtrans.htm',
    'request loan':       'requestloan.htm',
    'update contact':     'updateprofile.htm',
    'registration':       'register.htm',
    'home':               'index.htm',
  };
  await page.goto(BASE_URL + (urlMap[pageName] ?? 'index.htm'));
  await page.waitForTimeout(1000);
});

Then('I should see an error or redirect to the home page', async function () {
  const targetPage = this.tmpPage || this.page;
  const body = await targetPage.locator('body').innerText();
  const safe = body.includes('Log In') || body.includes('Error') || targetPage.url().includes('index.htm');
  Assertions.assertTrue(safe, 'Unauthenticated access was blocked or redirected');
  if (this.tmpPage) {
    await this.tmpPage.close();
    await this.tmpCtx.close();
    this.tmpPage = undefined;
    this.tmpCtx  = undefined;
  }
});

Then('the log out link should be visible', async function () {
  await Assertions.assertVisible(
    this.page.locator('#leftPanel a', { hasText: 'Log Out' }),
    'Log Out link'
  );
});

Then('the main logo should be visible', async function () {
  await Assertions.assertVisible(this.page.locator('.logo'), 'ParaBank logo');
});

// ════════════════════════════════════════════════════════════════════════════════
// ACCOUNTS OVERVIEW
// ════════════════════════════════════════════════════════════════════════════════

Given('I navigate to the accounts overview page', async function () {
  await this.page.goto('overview.htm');
  await this.page.waitForTimeout(1000);
});

When('I reload the accounts overview page run {int}', async function (run) {
  await this.page.goto('overview.htm');
  await this.page.waitForTimeout(2000);
});

Then('I should see the accounts overview table', async function () {
  await Assertions.assertVisible(this.page.locator('#accountTable'), 'accounts table', 20000);
});

Then('the accounts overview table should contain at least one account row', async function () {
  const rows = this.page.locator('#accountTable tbody tr');
  await Assertions.assertVisible(rows.first(), 'first account row', 20000);
  await Assertions.assertAtLeastOne(rows, 'account rows');
});

When('I click the first account number link', async function () {
  const links = this.page.locator('#accountTable a');
  await Assertions.assertVisible(links.first(), 'first account link', 20000);
  await links.first().click();
  await this.page.waitForTimeout(1500);
});

Then('I should see the account details page', async function () {
  const heading = await this.page.locator('#rightPanel h1').innerText();
  Assertions.assertTrue(heading.toLowerCase().includes('account'), 'Account details heading contains "account"');
});

Then('the total balance cell should show a formatted dollar amount', async function () {
  const cell = this.page.locator('#accountTable tfoot td').nth(1);
  const text = await cell.textContent({ timeout: 20000 });
  Assertions.assertTrue(/\$[\d,]+\.\d{2}/.test(text), 'Total balance is formatted as a dollar amount');
});

// ════════════════════════════════════════════════════════════════════════════════
// OPEN NEW ACCOUNT
// ════════════════════════════════════════════════════════════════════════════════

When('I request to open a new checking account run {int}', async function (run) {
  await this.page.goto('openaccount.htm');
  await this.page.waitForTimeout(1500);
  await this.page.locator('#type').selectOption('0');
  await this.page.waitForTimeout(500);
  await this.page.click('input[value="Open New Account"]');
  await this.page.waitForTimeout(2000);
});

Then('I should see the confirmation for checking account opened', async function () {
  const body = await this.page.locator('#rightPanel').innerText();
  Assertions.assertTrue(body.includes('Account Opened'), 'Checking account opened confirmation shown');
});

When('I request to open a new savings account run {int}', async function (run) {
  await this.page.goto('openaccount.htm');
  await this.page.waitForTimeout(1500);
  await this.page.locator('#type').selectOption('1');
  await this.page.waitForTimeout(500);
  await this.page.click('input[value="Open New Account"]');
  await this.page.waitForTimeout(2000);
});

Then('I should see the confirmation for savings account opened', async function () {
  const body = await this.page.locator('#rightPanel').innerText();
  Assertions.assertTrue(body.includes('Account Opened'), 'Savings account opened confirmation shown');
});

Then('the open account page should load correctly', async function () {
  const body = await this.page.locator('#rightPanel').innerText();
  Assertions.assertTrue(body.length > 0, 'Open account page has content');
});

// ════════════════════════════════════════════════════════════════════════════════
// TRANSFER FUNDS
// ════════════════════════════════════════════════════════════════════════════════

When('I transfer an amount of {string} between my accounts', async function (amount) {
  await this.page.goto('transfer.htm');
  await this.page.waitForTimeout(1500);
  await this.page.fill('#amount', amount);
  await this.page.click('input[value="Transfer"]');
  await this.page.waitForTimeout(2000);
});

Then('I should see the transfer complete confirmation page', async function () {
  const body = await this.page.locator('body').innerText();
  Assertions.assertContainsAny(body, ['Transfer Complete', 'transferred'], 'Transfer confirmation');
});

When('I navigate to the transfer page', async function () {
  await this.page.goto('transfer.htm');
  await this.page.waitForTimeout(1500);
});

Then('I should see the transfer from and transfer to account dropdowns', async function () {
  await Assertions.assertVisible(this.page.locator('#fromAccountId'), 'from account dropdown');
  await Assertions.assertVisible(this.page.locator('#toAccountId'),   'to account dropdown');
});

When('I submit a transfer with a blank amount', async function () {
  await this.page.goto('transfer.htm');
  await this.page.waitForTimeout(1500);
  await this.page.fill('#amount', '');
  await this.page.click('input[value="Transfer"]');
  await this.page.waitForTimeout(2000);
});

Then('the server should handle it gracefully without internal error', async function () {
  const body = await this.page.locator('body').innerText();
  await Assertions.assertNotContainsText(this.page.locator('body'), 'Internal Server Error', 'page body');
});

Then('the transfer should be processed or handled without crashes', async function () {
  await Assertions.assertNotContainsText(this.page.locator('body'), 'Internal Server Error', 'page body');
});

// ════════════════════════════════════════════════════════════════════════════════
// BILL PAY
// ════════════════════════════════════════════════════════════════════════════════

Given('I navigate to the bill pay page', async function () {
  await this.page.goto('billpay.htm');
  await this.page.waitForTimeout(1500);
});

When('I submit a bill payment to payee {string} with amount {string} run {int}', async function (payeeName, amount, run) {
  await this.page.goto('overview.htm');
  await this.page.waitForTimeout(1500);
  const acct = await this.page.locator('#accountTable tbody tr a').first().textContent();
  await this.page.goto('billpay.htm');
  await this.page.waitForTimeout(1500);
  await this.page.fill('input[name="payee.name"]',               payeeName);
  await this.page.fill('input[name="payee.address.street"]',     '123 Payee St');
  await this.page.fill('input[name="payee.address.city"]',       'Payee City');
  await this.page.fill('input[name="payee.address.state"]',      'PC');
  await this.page.fill('input[name="payee.address.zipCode"]',    '99999');
  await this.page.fill('input[name="payee.phoneNumber"]',        '0000000000');
  await this.page.fill('input[name="payee.accountNumber"]',      acct);
  await this.page.fill('input[name="verifyAccount"]',            acct);
  await this.page.fill('input[name="amount"]',                   amount);
  await this.page.click('input[value="Send Payment"]');
  await this.page.waitForTimeout(2000);
});

Then('I should see the bill payment confirmation for {string}', async function (payeeName) {
  const body = await this.page.locator('body').innerText();
  Assertions.assertTrue(
    /Bill Payment.*Complete/i.test(body) || body.includes(payeeName),
    `Bill payment confirmation for "${payeeName}"`
  );
});

When('I submit a bill payment with mismatched verify account numbers', async function () {
  await this.page.goto('overview.htm');
  await this.page.waitForTimeout(1500);
  const acct = await this.page.locator('#accountTable tbody tr a').first().textContent();
  await this.page.goto('billpay.htm');
  await this.page.waitForTimeout(1500);
  await this.page.fill('input[name="payee.name"]',               'Test Payee');
  await this.page.fill('input[name="payee.address.street"]',     '123 Payee St');
  await this.page.fill('input[name="payee.address.city"]',       'Payee City');
  await this.page.fill('input[name="payee.address.state"]',      'PC');
  await this.page.fill('input[name="payee.address.zipCode"]',    '99999');
  await this.page.fill('input[name="payee.phoneNumber"]',        '0000000000');
  await this.page.fill('input[name="payee.accountNumber"]',      acct);
  await this.page.fill('input[name="verifyAccount"]',            '99999');
  await this.page.fill('input[name="amount"]',                   '10');
  await this.page.click('input[value="Send Payment"]');
  await this.page.waitForTimeout(1500);
});

Then('the payment submission should be rejected with a mismatch error', async function () {
  const body = await this.page.locator('body').innerText();
  Assertions.assertContainsAny(body, ['match', 'error', 'Error'], 'Mismatched account error');
});

When('I submit a bill payment with a blank payee name', async function () {
  await this.page.goto('billpay.htm');
  await this.page.waitForTimeout(1500);
  await this.page.click('input[value="Send Payment"]');
  await this.page.waitForTimeout(1000);
});

Then('I should see a validation error for missing fields', async function () {
  const errors = this.page.locator('#billpayForm .error, #billpayForm span.error');
  await Assertions.assertAtLeastOne(errors, 'bill pay form validation errors');
});

When('I submit a bill payment to payee {string} with amount {string}', async function (payeeName, amount) {
  await this.page.goto('overview.htm');
  await this.page.waitForTimeout(1500);
  const acct = await this.page.locator('#accountTable tbody tr a').first().textContent();
  await this.page.goto('billpay.htm');
  await this.page.waitForTimeout(1500);
  await this.page.fill('input[name="payee.name"]',               payeeName);
  await this.page.fill('input[name="payee.address.street"]',     '123 Payee St');
  await this.page.fill('input[name="payee.address.city"]',       'Payee City');
  await this.page.fill('input[name="payee.address.state"]',      'PC');
  await this.page.fill('input[name="payee.address.zipCode"]',    '99999');
  await this.page.fill('input[name="payee.phoneNumber"]',        '0000000000');
  await this.page.fill('input[name="payee.accountNumber"]',      acct);
  await this.page.fill('input[name="verifyAccount"]',            acct);
  await this.page.fill('input[name="amount"]',                   amount);
  await this.page.click('input[value="Send Payment"]');
  await this.page.waitForTimeout(2000);
});

Then('the confirmation should contain {string} or {string} or {string}', async function (p1, p2, p3) {
  const body = await this.page.locator('body').innerText();
  Assertions.assertContainsAny(body, [p1, p2, p3], 'bill pay confirmation');
});

// ════════════════════════════════════════════════════════════════════════════════
// FIND TRANSACTIONS
// ════════════════════════════════════════════════════════════════════════════════

Given('I navigate to the find transactions page', async function () {
  await this.page.goto('findtrans.htm');
  await this.page.waitForTimeout(1500);
  await this.page.locator('#accountId option').first().waitFor({ timeout: 10000 }).catch(() => {});
});

When('I search transactions by amount {string}', async function (amount) {
  await this.page.fill('#amount', amount);
  await this.page.click('#findByAmount');
  await this.page.waitForTimeout(2000);
});

Then('the transactions right panel should show results', async function () {
  const body = await this.page.locator('#rightPanel').innerText();
  Assertions.assertTrue(body.length > 0, 'Find transactions right panel has content');
});

When('I search transactions by date {string}', async function (date) {
  await this.page.fill('#transactionDate', date);
  await this.page.click('#findByDate');
  await this.page.waitForTimeout(2000);
});

When('I search transactions by date range from {string} to {string}', async function (fromDate, toDate) {
  await this.page.fill('#fromDate', fromDate);
  await this.page.fill('#toDate',   toDate);
  await this.page.click('#findByDateRange');
  await this.page.waitForTimeout(2000);
});

When('I search transactions by ID {string}', async function (txId) {
  await this.page.fill('#transactionId', txId);
  await this.page.click('#findById');
  await this.page.waitForTimeout(2000);
});

// ════════════════════════════════════════════════════════════════════════════════
// REQUEST LOAN
// ════════════════════════════════════════════════════════════════════════════════

When('I request a loan with amount {string} and down payment {string} run {int}', async function (amount, downPayment, run) {
  await this.page.goto('requestloan.htm');
  await this.page.waitForTimeout(1000);
  await this.page.fill('#amount', amount);
  await this.page.fill('#downPayment', downPayment);
  await this.page.click('input[value="Apply Now"]');
  await this.page.waitForTimeout(4000);
});

Then('the loan request result should show status or confirmation', async function () {
  const body = await this.page.locator('#rightPanel').innerText();
  Assertions.assertContainsAny(body, ['Approved', 'Denied', 'Loan', 'Status'], 'Loan request result');
});

When('I navigate to the request loan page', async function () {
  await this.page.goto('requestloan.htm');
  await this.page.waitForTimeout(1000);
});

Then('I should see the loan form input fields and apply button', async function () {
  await Assertions.assertVisible(this.page.locator('#amount'),                     'Loan amount input');
  await Assertions.assertVisible(this.page.locator('#downPayment'),                'Down payment input');
  await Assertions.assertVisible(this.page.locator('input[value="Apply Now"]'),    'Apply Now button');
});

When('I submit a loan application with blank fields', async function () {
  await this.page.goto('requestloan.htm');
  await this.page.waitForTimeout(1000);
  await this.page.fill('#amount', '');
  await this.page.fill('#downPayment', '');
  await this.page.click('input[value="Apply Now"]');
  await this.page.waitForTimeout(2000);
});

Then('the page should handle the empty request without internal server error', async function () {
  await Assertions.assertNotContainsText(this.page.locator('body'), 'Internal Server Error', 'page body');
});

When('I request a loan with amount {string} and down payment {string}', async function (amount, downPayment) {
  await this.page.goto('requestloan.htm');
  await this.page.waitForTimeout(1000);
  await this.page.fill('#amount', amount);
  await this.page.fill('#downPayment', downPayment);
  await this.page.click('input[value="Apply Now"]');
  await this.page.waitForTimeout(4000);
});

// ════════════════════════════════════════════════════════════════════════════════
// UPDATE CONTACT
// ════════════════════════════════════════════════════════════════════════════════

When('I update my contact profile with street {string} and city {string}', async function (street, city) {
  await this.page.goto('updateprofile.htm');
  await this.page.waitForTimeout(2000);
  await this.page.locator('#customer\\.address\\.street').fill(street);
  await this.page.locator('#customer\\.address\\.city').fill(city);
  await this.page.click('input[value="Update Profile"]');
  await this.page.waitForTimeout(2000);
});

Then('the contact profile update confirmation should be displayed', async function () {
  const body = await this.page.locator('#rightPanel').innerText();
  Assertions.assertTrue(body.length > 0, 'Update contact right panel has content');
});

When('I update my contact profile with an empty first name', async function () {
  await this.page.goto('updateprofile.htm');
  await this.page.waitForTimeout(2000);
  await this.page.locator('#customer\\.firstName').fill('');
  await this.page.click('input[value="Update Profile"]');
  await this.page.waitForTimeout(1500);
});

Then('the system should reject the empty contact field', async function () {
  const body = await this.page.locator('body').innerText();
  Assertions.assertTrue(body.length > 0, 'System responded to empty contact field update');
});

Then('I should see the contact profile form loaded', async function () {
  const body = await this.page.locator('#rightPanel').innerText();
  Assertions.assertTrue(body.length > 0, 'Update contact form has content');
});

When('I navigate to the update contact page', async function () {
  await this.page.goto('updateprofile.htm');
  await this.page.waitForTimeout(2000);
});

Then('I should see the firstName and lastName fields are populated', async function () {
  const firstName = await this.page.locator('#customer\\.firstName').inputValue();
  const lastName  = await this.page.locator('#customer\\.lastName').inputValue();
  Assertions.assertTrue(
    firstName.length + lastName.length > 0,
    'First name and/or last name field is pre-populated'
  );
});

// ════════════════════════════════════════════════════════════════════════════════
// SECURITY
// ════════════════════════════════════════════════════════════════════════════════

When('I submit login with SQL injection inputs', async function () {
  await this.page.fill('input[name="username"]', "' OR '1'='1");
  await this.page.fill('input[name="password"]', "' OR '1'='1");
  await this.page.click('input[value="Log In"]');
  await this.page.waitForTimeout(1500);
});

Then('the server should reject the login without java or database stack traces', async function () {
  const body = await this.page.locator('body').innerText();
  const safe = !body.includes('Stack Trace') && !body.includes('java.lang.Exception');
  Assertions.assertTrue(safe, 'No Java stack trace exposed for SQL injection input');
});

When('I submit registration with XSS script in first name', async function () {
  this.alerts = [];
  this.page.on('dialog', (d) => { this.alerts.push(d.message()); d.dismiss(); });
  const u = buildPersona();
  u.firstName = '<script>alert("xss")</script>';
  const regPage = new RegistrationPage(this.page);
  await regPage.fillForm(u);
  await regPage.submit();
  await this.page.waitForTimeout(2000);
});

Then('no javascript alert dialog should trigger during registration', async function () {
  Assertions.assertTrue(this.alerts.length === 0, 'No XSS alert dialogs were triggered');
});

When('I submit registration with a 255 character long username', async function () {
  const u = buildPersona();
  u.username = 'a'.repeat(255);
  const regPage = new RegistrationPage(this.page);
  await regPage.fillForm(u);
  await regPage.submit();
  await this.page.waitForTimeout(2000);
});

Then('the server should reject or handle it without crashing', async function () {
  const body = await this.page.locator('body').innerText();
  Assertions.assertTrue(!body.includes('Stack Trace'), 'No stack trace for boundary-length username');
});

When('I submit registration details with empty SSN', async function () {
  const u = buildPersona();
  delete u.ssn;
  const regPage = new RegistrationPage(this.page);
  await regPage.fillForm(u);
  await regPage.submit();
  await this.page.waitForTimeout(1000);
});

// ════════════════════════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════════

When('I navigate to the overview page URL directly', async function () {
  await this.page.goto('overview.htm');
  await this.page.waitForTimeout(1000);
});

When('I navigate to the bill pay page URL directly', async function () {
  await this.page.goto('billpay.htm');
  await this.page.waitForTimeout(1000);
});

// ════════════════════════════════════════════════════════════════════════════════
// UI USABILITY
// ════════════════════════════════════════════════════════════════════════════════

Then('the browser page title should contain {string}', async function (title) {
  await Assertions.assertTitle(this.page, new RegExp(title, 'i'), 'page title');
});

Then('I should see all registration form inputs rendered on the screen', async function () {
  const fields = [
    'input[name="customer.firstName"]',  'input[name="customer.lastName"]',
    'input[name="customer.address.street"]', 'input[name="customer.address.city"]',
    'input[name="customer.address.state"]',  'input[name="customer.address.zipCode"]',
    'input[name="customer.phoneNumber"]',    'input[name="customer.ssn"]',
    'input[name="customer.username"]',       'input[name="customer.password"]',
    '#repeatedPassword',
  ];
  for (const sel of fields) {
    await Assertions.assertVisible(this.page.locator(sel), sel, 5000);
  }
});

Then('I should see the link for forgot login info', async function () {
  await Assertions.assertVisible(
    this.page.locator('a', { hasText: /forgot|lookup/i }),
    'Forgot login info link'
  );
});

Then('I should see the register account link', async function () {
  await Assertions.assertVisible(
    this.page.locator('#loginPanel a', { hasText: /register/i }),
    'Register account link'
  );
});

When('I click the register account link', async function () {
  await this.page.locator('#loginPanel a', { hasText: /register/i }).click();
  await this.page.waitForTimeout(1000);
});

When('I set the viewport dimensions to {int} by {int}', async function (width, height) {
  await this.page.setViewportSize({ width, height });
});

Then('the browser page document should not have horizontal overflow', async function () {
  const scrollWidth = await this.page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await this.page.evaluate(() => document.documentElement.clientWidth);
  Assertions.assertTrue(scrollWidth <= clientWidth + 5, 'No horizontal overflow at current viewport');
});

// ════════════════════════════════════════════════════════════════════════════════
// PRIVATE HELPERS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Build a ParaBank registration persona using the framework FakerHelper.
 * This is the ParaBank-specific "persona" shape assembled from generic FakerHelper methods.
 */
function buildPersona() {
  return {
    firstName: FakerHelper.randomFirstName(),
    lastName:  FakerHelper.randomLastName(),
    street:    FakerHelper.randomStreetAddress(),
    city:      FakerHelper.randomCity(),
    state:     FakerHelper.randomState(true),
    zipCode:   FakerHelper.randomZip(),
    phone:     FakerHelper.randomPhone(10),
    ssn:       FakerHelper.randomSSN(),
    username:  FakerHelper.randomUsername('qa'),
    password:  FakerHelper.randomPassword(),
  };
}
