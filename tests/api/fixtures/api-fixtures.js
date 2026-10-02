// tests/api/fixtures/api-fixtures.js
// ─────────────────────────────────────────────────────────────────────────────
// Custom Playwright fixtures for the ParaBank API test suite.
//
// DESIGN: Private Session Store
//   globalSetup runs ONCE and writes to .session.json:
//     - user + accounts  (live data from john/demo)
//     - sessionToken     (JWT — one per test run, signed with HMAC-SHA256)
//     - sessionCookie    (raw Set-Cookie from login response)
//
//   Fixtures read .session.json — 0 extra HTTP auth requests per test.
//
// FIXTURES EXPOSED:
//   authUser          Customer object (john/demo)
//   accounts          All accounts for john/demo
//   primaryAccountId  First account id
//   secondAccountId   Second account id
//   sessionToken      JWT string from private session store
//   authedRequest     APIRequestContext with Authorization + Cookie headers
//   xmlRequest        APIRequestContext with Accept: application/xml
//   isolatedRequest   Fresh unauthenticated context (for negative/error tests)
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const path = require('path');
const { test: base, expect } = require('@playwright/test');
const { loginWithRetry, getCustomerAccounts } = require('../helpers/api-helpers');

const SESSION_FILE = path.join(__dirname, '../.session.json');

const BASE_URL = process.env.PARABANK_API_URL ||
  'https://parabank.parasoft.com/parabank/services/bank/';

const JSON_HEADERS = {
  'Accept':       'application/json',
  'Content-Type': 'application/json',
};

const XML_HEADERS = {
  'Accept':       'application/xml',
  'Content-Type': 'application/xml',
};

// ── Private session loader ────────────────────────────────────────────────────

/**
 * Load the private session store from disk.
 * Falls back to a live login if the session file is absent or malformed.
 * @param {import('@playwright/test').APIRequestContext} request
 */
async function loadSession(request) {
  if (fs.existsSync(SESSION_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
      if (data && data.user && data.user.id) {
        return data;
      }
    } catch (e) {
      console.warn('[Fixture] Error reading .session.json, falling back to live login');
    }
  }

  console.log('[Fixture] Session file not found — performing live login fallback...');
  const user     = await loginWithRetry(request);
  const accounts = await getCustomerAccounts(request, user.id);
  return { user, accounts, sessionToken: null, sessionCookie: null };
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const test = base.extend({

  // ── authUser — john/demo Customer object ─────────────────────────────────
  authUser: async ({ request }, use) => {
    const session = await loadSession(request);
    expect(session.user,    'authUser must exist').toBeTruthy();
    expect(session.user.id, 'customerId must exist').toBeTruthy();
    await use(session.user);
  },

  // ── accounts — all Account objects for john/demo ─────────────────────────
  accounts: async ({ request }, use) => {
    const session = await loadSession(request);
    expect(Array.isArray(session.accounts), 'accounts must be an array').toBeTruthy();
    expect(session.accounts.length, 'must have at least 1 account').toBeGreaterThan(0);
    await use(session.accounts);
  },

  // ── primaryAccountId — first account ID ──────────────────────────────────
  primaryAccountId: async ({ accounts }, use) => {
    await use(accounts[0].id);
  },

  // ── secondAccountId — second account ID ──────────────────────────────────
  secondAccountId: async ({ accounts }, use) => {
    const id = accounts.length > 1 ? accounts[1].id : accounts[0].id;
    await use(id);
  },

  // ── sessionToken — JWT string from private session store ─────────────────
  // One token is minted per test run by globalSetup.
  // Tests can use this to send Authorization: Bearer <token> on requests.
  sessionToken: async ({ request }, use) => {
    const session = await loadSession(request);
    const token   = session.sessionToken || null;
    console.log(`[Fixture] sessionToken loaded — ${token ? token.slice(0, 40) + '...' : 'null'}`);
    await use(token);
  },

  // ── authedRequest — APIRequestContext with JWT + Cookie headers ───────────
  // Used by tests that want to simulate a fully authenticated API client
  // carrying the session token in Authorization and Cookie headers.
  authedRequest: async ({ playwright, request }, use) => {
    const session = await loadSession(request);
    const token   = session.sessionToken;
    const cookie  = session.sessionCookie;

    const extraHeaders = { ...JSON_HEADERS };
    if (token)  extraHeaders['Authorization'] = `Bearer ${token}`;
    if (cookie) extraHeaders['Cookie']        = String(cookie).split(';')[0]; // first cookie pair only

    const ctx = await playwright.request.newContext({
      baseURL:          'https://parabank.parasoft.com',
      extraHTTPHeaders: extraHeaders,
    });
    console.log(`[Fixture] authedRequest created with Authorization: Bearer ${token ? token.slice(0, 20) + '...' : 'none'}`);
    await use(ctx);
    await ctx.dispose();
  },

  // ── xmlRequest — APIRequestContext with XML content-type negotiation ──────
  xmlRequest: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL:          'https://parabank.parasoft.com',
      extraHTTPHeaders: XML_HEADERS,
    });
    await use(ctx);
    await ctx.dispose();
  },

  // ── isolatedRequest — fresh unauthenticated context (negative tests) ──────
  isolatedRequest: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL:          'https://parabank.parasoft.com',
      extraHTTPHeaders: JSON_HEADERS,
    });
    await use(ctx);
    await ctx.dispose();
  },
});

module.exports = { test, expect };
