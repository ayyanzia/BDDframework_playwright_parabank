// tests/fixtures/hybrid-fixtures.js
// ─────────────────────────────────────────────────────────────────────────────
// Hybrid UI & API Playwright Test Fixture
//
// 100% Async Architecture combining UI Browser Page Objects with REST API
// Request contexts to enable bi-directional frontend-backend data cross-validation.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { test: base, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { evaluateStatusCode, assertStatusWithSwitch } = require('../helpers/status-evaluator');

const SESSION_FILE = path.join(__dirname, '..', 'api', '.session.json');

/**
 * Async helper to load stored private session data
 */
async function loadPrivateSession() {
  if (fs.existsSync(SESSION_FILE)) {
    try {
      const data = fs.readFileSync(SESSION_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.warn('[HybridFixture] Could not parse .session.json:', e.message);
    }
  }
  return null;
}

const test = base.extend({

  // 1. Stored Session Token
  sessionData: async ({}, use) => {
    const data = await loadPrivateSession();
    await use(data);
  },

  // 2. Authenticated REST API Context with Bearer JWT and Cookie propagation
  authedRequest: async ({ playwright, sessionData }, use) => {
    const baseURL = 'https://parabank.parasoft.com';
    const extraHeaders = {
      'Accept': 'application/json, text/plain, */*'
    };

    if (sessionData && sessionData.sessionToken) {
      extraHeaders['Authorization'] = `Bearer ${sessionData.sessionToken}`;
    }
    if (sessionData && sessionData.sessionCookie) {
      extraHeaders['Cookie'] = sessionData.sessionCookie;
    }

    const context = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: extraHeaders,
    });

    await use(context);
    await context.dispose();
  },

  // 3. UI-API Cross Validation Helper
  crossValidator: async ({ page, authedRequest }, use) => {
    const validator = {

      /**
       * Async verification that UI value strictly equals API backend value
       */
      assertDataMatch: async (uiValue, apiValue, fieldName) => {
        console.log(`[CrossValidator] Asserting field '${fieldName}': UI='${uiValue}' <==> API='${apiValue}'`);
        expect(String(uiValue).trim(), `UI field '${fieldName}' must match API value`).toBe(String(apiValue).trim());
      },

      /**
       * Async verification of account balances between UI element and API JSON
       */
      assertBalanceMatch: async (uiBalanceText, apiBalanceNumber, accountId) => {
        const cleanUi = parseFloat(String(uiBalanceText).replace(/[\$,]/g, ''));
        const cleanApi = parseFloat(Number(apiBalanceNumber).toFixed(2));
        console.log(`[CrossValidator] Account ${accountId} Balance Match: UI=$${cleanUi} <==> API=$${cleanApi}`);
        expect(Math.abs(cleanUi - cleanApi), `Balance for Account ${accountId} must match between UI and API`).toBeLessThan(0.02);
      },

      /**
       * Async status evaluation using switch statement
       */
      validateStatus: async (response, expectedCode, label) => {
        await assertStatusWithSwitch(response, expectedCode, label, expect);
      }
    };

    await use(validator);
  }
});

module.exports = {
  test,
  expect
};
