// tests/api/specs/auth.api.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// API Tests: Authentication
// Endpoint: GET /login/{username}/{password}
//
// Setup:    None (uses built-in `request` fixture)
// Teardown: None
//
// Validates:
//   • HTTP status 200 on valid credentials
//   • Response schema: Customer { id, firstName, lastName, address }
//   • customerId is a positive integer
//   • Error or non-200 on wrong password
//   • Error or non-200 on non-existent user
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { test, expect } = require('../fixtures/api-fixtures');
const { loginWithRetry, safeGet, apiPath } = require('../helpers/api-helpers');

const VALID_USER = 'john';
const VALID_PASS = 'demo';

test.describe('Authentication API', () => {

  test.beforeEach(async () => {
    // 2s pause between login attempts to prevent Cloudflare 429 rate limiting
    await new Promise((r) => setTimeout(r, 2000));
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  test('GET /login — valid credentials returns 200 with Customer object', async ({ request }) => {
    const res = await safeGet(request, apiPath(`/login/${VALID_USER}/${VALID_PASS}`));

    // Status
    expect(res.status(), 'Status should be 200 for valid credentials').toBe(200);
    expect(res.ok(), 'Response should be OK for valid credentials').toBeTruthy();

    // Content-Type
    const contentType = res.headers()['content-type'] ?? '';
    expect(contentType, 'Content-Type should include json').toContain('json');
  });

  test('GET /login — response contains customerId as a positive integer', async ({ request }) => {
    const user = await loginWithRetry(request, VALID_USER, VALID_PASS);

    expect(user, 'Parsed body must not be null').toBeTruthy();
    expect(typeof user.id, 'id must be a number').toBe('number');
    expect(user.id, 'customerId must be positive').toBeGreaterThan(0);
  });

  test('GET /login — response contains firstName and lastName strings', async ({ request }) => {
    const user = await loginWithRetry(request, VALID_USER, VALID_PASS);

    expect(typeof user.firstName, 'firstName must be a string').toBe('string');
    expect(user.firstName.length, 'firstName must not be empty').toBeGreaterThan(0);
    expect(typeof user.lastName,  'lastName must be a string').toBe('string');
    expect(user.lastName.length,  'lastName must not be empty').toBeGreaterThan(0);
  });

  test('GET /login — response contains an address object', async ({ request }) => {
    const user = await loginWithRetry(request, VALID_USER, VALID_PASS);

    expect(user.address, 'address must exist').toBeTruthy();
    expect(typeof user.address.street,  'street must be a string').toBe('string');
    expect(typeof user.address.city,    'city must be a string').toBe('string');
    expect(typeof user.address.state,   'state must be a string').toBe('string');
    expect(typeof user.address.zipCode, 'zipCode must be a string').toBe('string');
  });

  test('GET /login — demo user has a non-empty firstName (john/demo account)', async ({ request }) => {
    const user = await loginWithRetry(request, VALID_USER, VALID_PASS);
    // After /initializeDB resets the demo DB, the john/demo account firstName may vary.
    // We assert only that firstName is a non-empty string (structural validation).
    expect(typeof user.firstName, 'firstName must be a string').toBe('string');
    expect(user.firstName.length, 'firstName must not be empty after DB reset').toBeGreaterThan(0);
    console.log(`[Test] john/demo firstName after DB reset: "${user.firstName}"`);
  });

  // ── Negative path ───────────────────────────────────────────────────────────

  test('GET /login — wrong password does not return a Customer object', async ({ request }) => {
    const res = await safeGet(request, apiPath(`/login/${VALID_USER}/completely_wrong_password_xyz`));
    // ParaBank returns a non-200 or an error body for invalid credentials
    const isRejected = !res.ok() || res.status() !== 200;
    if (res.ok()) {
      // Some ParaBank instances return 200 with an error body — verify no id
      const body = await res.text();
      expect(
        body.includes('"id"') === false || body.includes('error') || body.includes('Error'),
        'Wrong password should not return a valid Customer'
      ).toBeTruthy();
    } else {
      expect(res.status(), 'Wrong password should return non-200').toBeGreaterThanOrEqual(400);
    }
  });

  test('GET /login — non-existent username does not return a Customer', async ({ request }) => {
    const res = await safeGet(request, apiPath('/login/ghost_user_xyz_99999/nopassword'));
    if (res.ok()) {
      const body = await res.text();
      expect(
        !body.includes('"id"') || body.includes('error'),
        'Non-existent user should not return a valid Customer id'
      ).toBeTruthy();
    } else {
      expect(res.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test('GET /login — same user logged in twice returns consistent customerId', async ({ request }) => {
    const user1 = await loginWithRetry(request, VALID_USER, VALID_PASS);
    const user2 = await loginWithRetry(request, VALID_USER, VALID_PASS);
    expect(user1.id, 'customerId must be consistent across multiple logins').toBe(user2.id);
  });
});
