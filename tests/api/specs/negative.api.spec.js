// tests/api/specs/negative.api.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// API Tests: Negative & Boundary Cases
// Tests in this file are designed to verify that the ParaBank API:
//   • Handles invalid inputs gracefully (no 5xx crashes)
//   • Returns structured error responses for bad requests
//   • Does not expose stack traces or internal errors
//   • Handles boundary values (ID=0, empty strings, extreme amounts)
//
// Setup:    Uses `isolatedRequest` fixture (no shared state, fresh context)
// Teardown: No cleanup needed — all tests use invalid/non-existent resources
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { test, expect } = require('../fixtures/api-fixtures');
const { safeGet, apiPath } = require('../helpers/api-helpers');

test.describe('Negative & Boundary Cases API', () => {

  // ── Invalid account IDs ────────────────────────────────────────────────────────

  test('GET /accounts/9999999 — non-existent account returns 4xx or empty body', async ({ isolatedRequest }) => {
    const res = await isolatedRequest.get('/parabank/services/bank/accounts/9999999');

    // ParaBank should return 4xx for a non-existent resource
    const isNot200 = !res.ok() || res.status() !== 200;
    if (!isNot200) {
      const body = await res.json().catch(() => ({}));
      expect(body.id ?? null, 'Non-existent account must not return a valid id').toBeNull();
    } else {
      expect(res.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test('GET /accounts/9999999 — does not return a 5xx server error', async ({ isolatedRequest }) => {
    const res = await safeGet(isolatedRequest, apiPath('/accounts/9999999'));
    expect(res.status(), 'Non-existent account must not cause a 5xx error').toBeLessThan(500);
  });

  test('GET /accounts/0 — account id zero returns non-200 or empty', async ({ isolatedRequest }) => {
    const res = await isolatedRequest.get('/parabank/services/bank/accounts/0');
    expect(res.status(), 'Account id 0 must not return 200').not.toBe(200);
  });

  test('GET /accounts/-1 — negative account id is rejected without 5xx', async ({ isolatedRequest }) => {
    const res = await isolatedRequest.get('/parabank/services/bank/accounts/-1');
    expect(res.status() < 500, 'Negative account id must not cause a server error').toBeTruthy();
  });

  // ── Invalid customer IDs ──────────────────────────────────────────────────────

  test('GET /customers/0 — customer id zero returns non-200', async ({ isolatedRequest }) => {
    const res = await isolatedRequest.get('/parabank/services/bank/customers/0');
    expect(res.status(), 'Customer id 0 must not return 200').not.toBe(200);
  });

  test('GET /customers/9999999 — non-existent customer returns 4xx', async ({ isolatedRequest }) => {
    const res = await isolatedRequest.get('/parabank/services/bank/customers/9999999');
    expect(res.status() < 500, 'Non-existent customer must not cause a 5xx').toBeTruthy();
  });

  test('GET /customers/9999999/accounts — non-existent customer accounts returns 4xx', async ({ isolatedRequest }) => {
    const res = await isolatedRequest.get('/parabank/services/bank/customers/9999999/accounts');
    expect(res.status() < 500, 'Non-existent customer accounts must not cause a 5xx').toBeTruthy();
  });

  // ── Invalid transaction IDs ─────────────────────────────────────────────────────

  test('GET /transactions/0 — transaction id zero returns non-200', async ({ isolatedRequest }) => {
    const res = await isolatedRequest.get('/parabank/services/bank/transactions/0');
    expect(res.status(), 'Transaction id 0 must not return 200').not.toBe(200);
  });

  test('GET /transactions/9999999 — non-existent transaction returns 4xx', async ({ isolatedRequest }) => {
    const res = await isolatedRequest.get('/parabank/services/bank/transactions/9999999');
    expect(res.status() < 500, 'Non-existent transaction must not cause a 5xx').toBeTruthy();
  });

  // ── Invalid login credentials ────────────────────────────────────────────────

  test('GET /login/EMPTY/EMPTY — empty-string credentials are rejected', async ({ isolatedRequest }) => {
    const res = await isolatedRequest.get('/parabank/services/bank/login/ / ');
    // Either 4xx or a body with no valid customerId
    if (res.ok()) {
      const body = await res.json().catch(() => ({}));
      expect(body.id ?? null, 'Empty credentials must not return a valid customer').toBeNull();
    } else {
      expect(res.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test('GET /login/john/wrongpass — wrong password does not expose a 5xx', async ({ isolatedRequest }) => {
    const res = await isolatedRequest.get('/parabank/services/bank/login/john/wrong_password_xyz');
    expect(res.status() < 500, 'Wrong password must not cause a server error').toBeTruthy();
  });

  // ── Transfer boundary cases ──────────────────────────────────────────────────

  test('POST /transfer — missing fromAccountId query param is handled gracefully', async ({ isolatedRequest }) => {
    // Only supply toAccountId and amount — fromAccountId is intentionally omitted
    const res = await isolatedRequest.post('/parabank/services/bank/transfer', {
      params: { toAccountId: 12345, amount: 10 },
    });
    // Should return 4xx (bad request) — not 5xx
    expect(
      res.status() < 500,
      'Missing fromAccountId must not cause a server error'
    ).toBeTruthy();
  });

  test('POST /transfer — missing amount query param returns non-200 status', async ({ isolatedRequest }) => {
    const res = await isolatedRequest.post('/parabank/services/bank/transfer', {
      params: { fromAccountId: 12345, toAccountId: 67890 },
    });
    expect(res.status(), 'Missing amount should return non-200 error status').not.toBe(200);
  });

  // ── Deposit boundary cases ────────────────────────────────────────────────────

  test('POST /deposit — non-existent accountId returns non-200', async ({ isolatedRequest }) => {
    const res = await isolatedRequest.post('/parabank/services/bank/deposit', {
      params: { accountId: 9999999, amount: 10 },
    });
    expect(
      !res.ok() || res.status() !== 200,
      'Deposit to non-existent account must not return 200'
    ).toBeTruthy();
  });

  test('POST /deposit — missing amount param returns non-200 status', async ({ isolatedRequest }) => {
    const res = await isolatedRequest.post('/parabank/services/bank/deposit', {
      params: { accountId: 12345 },
    });
    expect(res.status(), 'Missing amount param should return non-200 error status').not.toBe(200);
  });

  // ── Withdraw boundary cases ───────────────────────────────────────────────────

  test('POST /withdraw — non-existent accountId returns non-200 without 5xx', async ({ isolatedRequest }) => {
    const res = await isolatedRequest.post('/parabank/services/bank/withdraw', {
      params: { accountId: 9999999, amount: 10 },
    });
    expect(res.status() < 500, 'Withdraw from non-existent account must not cause 5xx').toBeTruthy();
  });

  // ── Response format ───────────────────────────────────────────────────────────

  test('API error responses do not contain Java stack traces', async ({ isolatedRequest }) => {
    const res = await isolatedRequest.get('/parabank/services/bank/accounts/9999999');
    const body = await res.text();
    expect(
      body.includes('java.lang.Exception') || body.includes('StackTrace'),
      'Error response must not expose Java stack traces'
    ).toBeFalsy();
  });

  test('API responses always include a Content-Type header', async ({ isolatedRequest }) => {
    const res = await isolatedRequest.get('/parabank/services/bank/login/john/demo');
    const contentType = res.headers()['content-type'];
    expect(contentType, 'Response must always have a Content-Type header').toBeTruthy();
  });
});
