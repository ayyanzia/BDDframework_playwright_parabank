// tests/api/helpers/api-helpers.js
// ─────────────────────────────────────────────────────────────────────────────
// Reusable helper functions for the ParaBank API test suite.
// All functions accept an APIRequestContext and return parsed JSON.
//
// Includes:
//   - Authentication helpers (login, loginWithRetry)
//   - Customer / Account / Transaction / Financial operation helpers
//   - registerUser — POST /register new user → returns Customer
//   - assertStatus / assertStatusClass — inline HTTP status code assertions
//   - Rate-limit safe wrappers (safeGet, safePost) with 429 backoff
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const API_BASE = '/parabank/services/bank';

/**
 * Resolve a path against the ParaBank services base.
 * Allows tests to use short paths like '/login/john/demo'
 * even when the APIRequestContext baseURL is the full app root.
 * @param {string} path
 * @returns {string}
 */
function apiPath(path) {
  // Strip leading slash so Playwright joins cleanly against baseURL ('.../services/bank/')
  return path.startsWith('/') ? path.slice(1) : path;
}

/**
 * Execute request.get with automatic 12s wait on HTTP 429 (Cloudflare rate limit backoff).
 */
async function safeGet(request, url, options) {
  let res = await request.get(url, options);
  if (res.status() === 429) {
    console.warn(`[ApiHelper] 429 on GET ${url} — waiting 12s...`);
    await new Promise((r) => setTimeout(r, 12_000));
    res = await request.get(url, options);
  }
  return res;
}

/**
 * Execute request.post with automatic 12s wait on HTTP 429 (Cloudflare rate limit backoff).
 */
async function safePost(request, url, options) {
  let res = await request.post(url, options);
  if (res.status() === 429) {
    console.warn(`[ApiHelper] 429 on POST ${url} — waiting 12s...`);
    await new Promise((r) => setTimeout(r, 12_000));
    res = await request.post(url, options);
  }
  return res;
}

// ── Authentication ────────────────────────────────────────────────────────────

/**
 * Login and return the Customer object.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>} Customer
 */
async function login(request, username = 'john', password = 'demo') {
  const res = await safeGet(request, apiPath(`/login/${username}/${password}`));
  if (!res.ok()) {
    throw new Error(`[ApiHelper] login failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Login with automatic retry and exponential backoff on HTTP 429 (rate limit).
 */
async function loginWithRetry(request, username = 'john', password = 'demo', maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await safeGet(request, apiPath(`/login/${username}/${password}`));
    if (res.ok()) {
      return res.json();
    }
    if (res.status() === 429) {
      const waitMs = attempt * 35_000;
      console.warn(
        `[ApiHelper] Rate limited (HTTP 429). Waiting ${waitMs / 1000}s before retry ${attempt}/${maxRetries}...`
      );
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    throw new Error(`[ApiHelper] login failed: ${res.status()} ${await res.text()}`);
  }
  throw new Error(`[ApiHelper] login still rate-limited after ${maxRetries} retries`);
}

// ── Customers ─────────────────────────────────────────────────────────────────

/**
 * Get a customer's detail by ID.
 */
async function getCustomer(request, customerId) {
  const res = await safeGet(request, apiPath(`/customers/${customerId}`));
  return { res, body: res.ok() ? await res.json() : null };
}

/**
 * Get all accounts for a customer.
 */
async function getCustomerAccounts(request, customerId) {
  const res = await safeGet(request, apiPath(`/customers/${customerId}/accounts`));
  if (!res.ok()) throw new Error(`[ApiHelper] getCustomerAccounts failed: ${res.status()}`);
  return res.json();
}

/**
 * Update customer information.
 */
async function updateCustomer(request, customerId, params) {
  const res = await safePost(request, apiPath(`/customers/update/${customerId}`), {
    params,
  });
  return { res, body: res.ok() ? await res.text() : await res.text() };
}

// ── Accounts ─────────────────────────────────────────────────────────────────

/**
 * Get an account by ID.
 */
async function getAccount(request, accountId) {
  const res = await safeGet(request, apiPath(`/accounts/${accountId}`));
  return { res, body: res.ok() ? await res.json() : null };
}

/**
 * Create a new account.
 */
async function createAccount(request, { customerId, newAccountType, fromAccountId }) {
  const res = await safePost(request, apiPath('/createAccount'), {
    params: { customerId, newAccountType, fromAccountId },
  });
  return { res, body: res.ok() ? await res.json() : null };
}

// ── Transactions ──────────────────────────────────────────────────────────────

/**
 * Get all transactions for an account.
 */
async function getTransactions(request, accountId) {
  const res = await safeGet(request, apiPath(`/accounts/${accountId}/transactions`));
  return { res, body: res.ok() ? await res.json() : [] };
}

/**
 * Get a single transaction by ID.
 */
async function getTransaction(request, transactionId) {
  const res = await safeGet(request, apiPath(`/transactions/${transactionId}`));
  return { res, body: res.ok() ? await res.json() : null };
}

/**
 * Find transactions by amount.
 */
async function getTransactionsByAmount(request, accountId, amount) {
  const res = await safeGet(request, apiPath(`/accounts/${accountId}/transactions/amount/${amount}`));
  return { res, body: res.ok() ? await res.json() : [] };
}

/**
 * Find transactions by date range.
 */
async function getTransactionsByDateRange(request, accountId, fromDate, toDate) {
  const res = await safeGet(
    request,
    apiPath(`/accounts/${accountId}/transactions/fromDate/${fromDate}/toDate/${toDate}`)
  );
  return { res, body: res.ok() ? await res.json() : [] };
}

/**
 * Find transactions on a specific date.
 */
async function getTransactionsOnDate(request, accountId, onDate) {
  const res = await safeGet(request, apiPath(`/accounts/${accountId}/transactions/onDate/${onDate}`));
  return { res, body: res.ok() ? await res.json() : [] };
}

/**
 * Find transactions by month and type.
 */
async function getTransactionsByMonthAndType(request, accountId, month, type) {
  const res = await safeGet(
    request,
    apiPath(`/accounts/${accountId}/transactions/month/${month}/type/${type}`)
  );
  return { res, body: res.ok() ? await res.json() : [] };
}

// ── Financial Operations ─────────────────────────────────────────────────────

/**
 * Transfer funds between two accounts.
 */
async function transfer(request, { fromAccountId, toAccountId, amount }) {
  const res = await safePost(request, apiPath('/transfer'), {
    params: { fromAccountId, toAccountId, amount },
  });
  return { res, body: res.ok() ? await res.text() : await res.text() };
}

/**
 * Deposit funds into an account.
 */
async function deposit(request, { accountId, amount }) {
  const res = await safePost(request, apiPath('/deposit'), {
    params: { accountId, amount },
  });
  return { res, body: res.ok() ? await res.text() : await res.text() };
}

/**
 * Withdraw funds from an account.
 */
async function withdraw(request, { accountId, amount }) {
  const res = await safePost(request, apiPath('/withdraw'), {
    params: { accountId, amount },
  });
  return { res, body: res.ok() ? await res.text() : await res.text() };
}

/**
 * Pay a bill.
 */
async function billPay(request, { accountId, amount }, payee) {
  const res = await safePost(request, apiPath('/billpay'), {
    params: { accountId, amount },
    data: payee,
    headers: { 'Content-Type': 'application/json' },
  });
  return { res, body: res.ok() ? await res.json() : null };
}

/**
 * Request a loan.
 */
async function requestLoan(request, { customerId, amount, downPayment, fromAccountId }) {
  const res = await safePost(request, apiPath('/requestLoan'), {
    params: { customerId, amount, downPayment, fromAccountId },
  });
  return { res, body: res.ok() ? await res.json() : null };
}

// ── Registration ─────────────────────────────────────────────────────────────

/**
 * Register a new ParaBank user via POST /register.
 * ParaBank /register accepts form-encoded parameters (not JSON body).
 * On success returns a Customer object with the new user's id and username.
 *
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {{ firstName: string, lastName: string, street: string, city: string,
 *           state: string, zipCode: string, phone: string, ssn: string,
 *           username: string, password: string }} userData
 * @returns {Promise<{ res: import('@playwright/test').APIResponse, body: object|null }>}
 */
async function registerUser(request, userData) {
  const res = await safePost(request, apiPath('/register'), {
    params: {
      'customer.firstName':          userData.firstName,
      'customer.lastName':           userData.lastName,
      'customer.address.street':     userData.street,
      'customer.address.city':       userData.city,
      'customer.address.state':      userData.state,
      'customer.address.zipCode':    userData.zipCode,
      'customer.phoneNumber':        userData.phone,
      'customer.ssn':                userData.ssn,
      'customer.username':           userData.username,
      'customer.password':           userData.password,
      'repeatedPassword':            userData.password,
    },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // ParaBank may return plain text on registration errors
    const text = await res.text().catch(() => '');
    body = { error: text };
  }
  return { res, body };
}

// ── Status Code Assertions ─────────────────────────────────────────────────────

/**
 * Assert an exact HTTP status code inline (no expect import needed in caller).
 * Logs the actual code and reason phrase for debugging.
 *
 * @param {import('@playwright/test').APIResponse} res
 * @param {number} expected
 * @param {string} label - Description of the call being tested
 * @param {Function} expect - Playwright `expect` function passed from the test
 */
function assertStatus(res, expected, label, expect) {
  const actual = res.status();
  const REASONS = {
    200: 'OK', 201: 'Created', 204: 'No Content',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not Found', 409: 'Conflict', 500: 'Internal Server Error',
  };
  console.log(`[Status] ${label} → HTTP ${actual} ${REASONS[actual] || ''}`);
  expect(actual, `${label} — expected HTTP ${expected}, got ${actual} ${REASONS[actual] || ''}`).toBe(expected);
}

/**
 * Assert the response belongs to a status class (2xx, 4xx, 5xx).
 *
 * @param {import('@playwright/test').APIResponse} res
 * @param {2|4|5} classCode
 * @param {string} label
 * @param {Function} expect
 */
function assertStatusClass(res, classCode, label, expect) {
  const actual = res.status();
  const floor  = classCode * 100;
  const ceil   = floor + 99;
  console.log(`[Status] ${label} → HTTP ${actual} (expected ${floor}-${ceil})`);
  expect(
    actual >= floor && actual <= ceil,
    `${label} — expected HTTP ${floor}-${ceil}, got ${actual}`
  ).toBeTruthy();
}

// ── Utility ───────────────────────────────────────────────────────────────────

/**
 * Build a date string in MM-DD-YYYY format for today or N days ago.
 * @param {number} [daysAgo=0]
 * @returns {string}
 */
function dateString(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

/**
 * Build a sample Payee object for bill-pay tests.
 * @param {number} targetAccountId - The account number to pay to
 */
function buildPayee(targetAccountId) {
  return {
    name:        'QA Automation Payee',
    address: {
      street:  '123 Test Street',
      city:    'Testville',
      state:   'QA',
      zipCode: '00001',
    },
    phoneNumber:   '5550001234',
    accountNumber: targetAccountId,
  };
}

module.exports = {
  apiPath,
  login,
  loginWithRetry,
  getCustomer,
  getCustomerAccounts,
  updateCustomer,
  getAccount,
  createAccount,
  getTransactions,
  getTransaction,
  getTransactionsByAmount,
  getTransactionsByDateRange,
  getTransactionsOnDate,
  getTransactionsByMonthAndType,
  transfer,
  deposit,
  withdraw,
  billPay,
  requestLoan,
  registerUser,
  assertStatus,
  assertStatusClass,
  dateString,
  buildPayee,
  safeGet,
  safePost,
};
