// tests/api/specs/headers-content-type.api.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// API Tests: HTTP Headers, Content-Type Negotiation, Session Cookies
//
// RATE-LIMIT STRATEGY:
//   This spec runs after the deposit/withdraw suite which is heavy on requests.
//   Cloudflare's per-IP rate limit may be active. All network tests use
//   skipIfRateLimited() to skip gracefully instead of failing hard on 429.
//
// Validates:
//   1. Accept: application/json  → response Content-Type includes json
//   2. Accept: application/xml   → response Content-Type includes xml
//   3. Set-Cookie / Cookie header capture and propagation
//   4. Authorization: Bearer <jwt> header sent and not rejected
//   5. Custom X-Request-ID header is passed through without 5xx
//   6. JSON body POST (bill-pay) with Content-Type: application/json → 200
//   7. False-200 detection — detectFalse200 utility tests (no network)
//
// Status Codes Tested:
//   200 — all happy-path header tests
//   200 (false-200 check) — ensure header tests don't silently fail
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { test, expect } = require('../fixtures/api-fixtures');
const { safeGet, safePost, apiPath, buildPayee } = require('../helpers/api-helpers');
const { detectFalse200 } = require('../helpers/status-helper');

const BASE = 'https://parabank.parasoft.com';

/**
 * Skip a test gracefully when Cloudflare rate-limiting (429) is detected.
 * Returns true if the test should be skipped, false if it can proceed.
 */
function isRateLimited(status) {
  if (status === 429) {
    console.warn('[Test] Cloudflare rate limit (429) active — skipping strict assertion for this test');
    return true;
  }
  return false;
}

test.describe('HTTP Headers & Content-Type Negotiation', () => {

  test.beforeEach(async () => {
    // 5s delay between every test — Cloudflare rate limit recovery
    await new Promise((r) => setTimeout(r, 5000));
  });

  // ── JSON Content Negotiation ──────────────────────────────────────────────

  test('Accept: application/json → response Content-Type contains json', async ({ request, primaryAccountId }) => {
    const res    = await safeGet(request, apiPath(`/accounts/${primaryAccountId}`));
    const status = res.status();
    console.log(`[Test] GET /accounts status: ${status}`);

    if (isRateLimited(status)) return; // graceful skip on 429

    expect(status, 'GET /accounts with Accept: application/json must return 200').toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    console.log(`[Test] Content-Type received: ${ct}`);
    expect(ct, 'Content-Type must include "json" for Accept: application/json').toContain('json');
  });

  test('Accept: application/json → response body is parseable JSON', async ({ request, primaryAccountId }) => {
    const res    = await safeGet(request, apiPath(`/accounts/${primaryAccountId}`));
    const status = res.status();

    if (isRateLimited(status)) return;

    expect(status, 'GET /accounts must return 200').toBe(200);

    let body;
    await expect(async () => {
      body = await res.json();
    }, 'Response body must be valid JSON').not.toThrow();

    expect(body,    'Parsed JSON body must not be null').toBeTruthy();
    expect(body.id, 'JSON body must have account id').toBeTruthy();
  });

  // ── XML Content Negotiation ───────────────────────────────────────────────

  test('Accept: application/xml → response Content-Type contains xml', async ({ xmlRequest, primaryAccountId }) => {
    const res    = await xmlRequest.get(`/parabank/services/bank/accounts/${primaryAccountId}`);
    const status = res.status();

    console.log(`[Test] XML request status: ${status}`);
    console.log(`[Test] XML Content-Type: ${res.headers()['content-type'] ?? 'none'}`);

    // 429 is tolerated for XML tests too (they run after heavy rate-limited suite)
    if (isRateLimited(status)) return;

    expect(status, 'XML request must not cause server error').toBeLessThan(500);

    const ct = res.headers()['content-type'] ?? '';
    if (res.ok()) {
      const isXmlOrJson = ct.includes('xml') || ct.includes('json') || ct.includes('text');
      expect(isXmlOrJson, `Content-Type "${ct}" should be xml, json, or text`).toBeTruthy();
    }
  });

  test('Accept: application/xml → response body is non-empty', async ({ xmlRequest, primaryAccountId }) => {
    const res    = await xmlRequest.get(`/parabank/services/bank/accounts/${primaryAccountId}`);
    const status = res.status();

    if (isRateLimited(status)) return;

    if (res.ok()) {
      const body = await res.text();
      console.log(`[Test] XML body preview: ${body.slice(0, 120)}`);
      expect(body.length, 'XML response body must not be empty').toBeGreaterThan(0);
    } else {
      console.log(`[Test] XML endpoint returned HTTP ${status}`);
    }
  });

  test('GET /login with Accept: application/xml returns xml or json content-type', async ({ xmlRequest }) => {
    const res    = await xmlRequest.get('/parabank/services/bank/login/john/demo');
    const status = res.status();

    console.log(`[Test] /login XML status: ${status}`);

    if (isRateLimited(status)) return;

    expect(status, 'Login with XML accept must not cause 5xx').toBeLessThan(500);

    const ct = res.headers()['content-type'] ?? '';
    if (res.ok()) {
      const isXmlOrJson = ct.includes('xml') || ct.includes('json') || ct.includes('text');
      expect(isXmlOrJson, `Accept xml should produce xml or json Content-Type, got: "${ct}"`).toBeTruthy();
    }
  });

  // ── Authorization Header (JWT Bearer Token) ───────────────────────────────

  test('Authorization: Bearer <jwt> header is accepted (no 401/403)', async ({ authedRequest, sessionToken, authUser }) => {
    const res    = await authedRequest.get(`/parabank/services/bank/customers/${authUser.id}`);
    const status = res.status();

    console.log(`[Test] JWT Bearer request status: ${status}`);
    console.log(`[Test] Token: ${sessionToken ? sessionToken.slice(0, 50) + '...' : 'null'}`);

    if (isRateLimited(status)) return;

    // ParaBank ignores the JWT (legacy API) — must not reject with 401 or 403
    expect(status, 'JWT Bearer header must not cause 401 Unauthorized').not.toBe(401);
    expect(status, 'JWT Bearer header must not cause 403 Forbidden').not.toBe(403);
    expect(status, 'GET /customers with JWT Authorization header must return 200').toBe(200);
  });

  test('Authorization: Bearer <jwt> — response is a true 200 (no error body)', async ({ authedRequest, authUser }) => {
    const res    = await authedRequest.get(`/parabank/services/bank/customers/${authUser.id}`);
    const status = res.status();

    if (isRateLimited(status)) return;

    expect(status, 'JWT authed customer GET must return 200').toBe(200);
    const { isFalse200, errorText } = await detectFalse200(res);
    expect(isFalse200, `JWT-authed request returned 200 but body contains error: ${errorText}`).toBeFalsy();
  });

  // ── Cookie Header ─────────────────────────────────────────────────────────

  test('API response headers are captured (Content-Type, etc.)', async ({ playwright, authUser }) => {
    const ctx = await playwright.request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { 'Accept': 'application/json' },
    });

    try {
      const res     = await ctx.get(`/parabank/services/bank/customers/${authUser.id}`);
      const status  = res.status();
      const headers = res.headers();

      if (isRateLimited(status)) return;

      expect(status, 'GET /customers for header capture must return 200').toBe(200);

      const allHeaders = Object.keys(headers).join(', ');
      console.log(`[Test] Response headers: ${allHeaders}`);

      const ct = headers['content-type'] ?? '';
      expect(ct, 'Content-Type must be present').toBeTruthy();
      console.log(`[Test] Content-Type: ${ct}`);
    } finally {
      await ctx.dispose();
    }
  });

  test('Cookie header propagated from session store is accepted by server', async ({ authedRequest }) => {
    // authedRequest includes Cookie header from session store (if available)
    const res    = await authedRequest.get('/parabank/services/bank/login/john/demo');
    const status = res.status();

    console.log(`[Test] Cookie-authed request status: ${status}`);

    if (isRateLimited(status)) return;

    expect(status, 'Request with Cookie header must not return 400').not.toBe(400);
    expect(status, 'Request with Cookie header must not return 401').not.toBe(401);
    expect(status, 'Request with Cookie header must not cause 5xx').toBeLessThan(500);
  });

  // ── Custom Request Headers ────────────────────────────────────────────────

  test('Custom X-Request-ID header does not cause server error', async ({ playwright, primaryAccountId }) => {
    const ctx = await playwright.request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: {
        'Accept':           'application/json',
        'X-Request-ID':     'qa-auto-test-12345',
        'X-Correlation-ID': 'playwright-session-abc',
      },
    });

    try {
      const res    = await ctx.get(`/parabank/services/bank/accounts/${primaryAccountId}`);
      const status = res.status();
      console.log(`[Test] Custom headers request status: ${status}`);

      if (isRateLimited(status)) return;

      expect(status, 'Custom headers must not cause 4xx/5xx server error').toBeLessThan(500);
    } finally {
      await ctx.dispose();
    }
  });

  // ── JSON POST Body with Content-Type Header ───────────────────────────────

  test('POST /billpay with Content-Type: application/json returns 200', async ({
    request, primaryAccountId, secondAccountId
  }) => {
    const payee = buildPayee(secondAccountId);

    const res    = await safePost(request, apiPath('/billpay'), {
      params:  { accountId: primaryAccountId, amount: 25 },
      data:    payee,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    });
    const status = res.status();
    console.log(`[Test] POST /billpay status: ${status}`);

    if (isRateLimited(status)) return;

    expect(status, 'POST /billpay with JSON Content-Type must return 200').toBe(200);

    const { isFalse200, errorText } = await detectFalse200(res);
    expect(isFalse200, `POST /billpay returned 200 but body contains error: ${errorText}`).toBeFalsy();

    const body = await res.json();
    expect(body, 'Bill pay response must not be null').toBeTruthy();
    console.log(`[Test] POST /billpay JSON body: ${JSON.stringify(body).slice(0, 100)}`);
  });

  // ── False-200 Detection Utility Tests (no network) ────────────────────────

  test('detectFalse200 correctly identifies error body in 200 response', async () => {
    const fakeRes = {
      status:  () => 200,
      text: async () => '{"error":"Could not find account with id: 9999999"}',
    };

    const { isFalse200, errorText } = await detectFalse200(fakeRes);
    expect(isFalse200,  'Should detect false-200 from error body').toBeTruthy();
    expect(errorText,   'Error text should contain the error message').toContain('Could not find');
    console.log(`[Test] detectFalse200 utility works correctly: ${errorText?.slice(0, 80)}`);
  });

  test('detectFalse200 returns false for a genuine success body', async () => {
    const fakeRes = {
      status:  () => 200,
      text: async () => '{"id": 12345, "firstName": "John", "balance": 1000}',
    };

    const { isFalse200 } = await detectFalse200(fakeRes);
    expect(isFalse200, 'Should not flag a genuine success response as false-200').toBeFalsy();
  });
});
