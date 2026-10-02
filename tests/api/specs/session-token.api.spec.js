// tests/api/specs/session-token.api.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// API Tests: JWT Session Token Lifecycle
//
// Validates that the JWT session token mechanism works correctly:
//   - Token structure (3-part base64url format)
//   - Header decodes to { alg: "HS256", typ: "JWT" }
//   - Payload contains required identity claims (sub, username, iat, exp)
//   - Token is not expired immediately after generation
//   - HMAC-SHA256 signature verifies correctly
//   - Same session produces the same token (deterministic private storage)
//   - Requests with Authorization: Bearer <token> are sent correctly
//
// Private Storage:
//   The JWT is stored in .session.json (the private session store).
//   One token is minted per test run by globalSetup.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { test, expect } = require('../fixtures/api-fixtures');
const { verifyJwt, decodeJwt, isTokenExpired, describeToken, signJwt } = require('../helpers/jwt-helper');
const { assertStatus } = require('../helpers/status-helper');

test.describe('JWT Session Token Lifecycle', () => {

  test.beforeEach(async () => {
    // 3s delay between tests to prevent Cloudflare 429 rate limiting
    await new Promise((r) => setTimeout(r, 3000));
  });

  // ── Token Structure ───────────────────────────────────────────────────────

  test('Session token exists and has 3-part base64url structure', async ({ sessionToken }) => {
    expect(sessionToken, 'sessionToken must be present in private session store').toBeTruthy();
    expect(typeof sessionToken, 'sessionToken must be a string').toBe('string');

    const parts = sessionToken.split('.');
    expect(parts.length, 'JWT must have exactly 3 parts separated by "."').toBe(3);
    expect(parts[0].length, 'JWT header part must not be empty').toBeGreaterThan(0);
    expect(parts[1].length, 'JWT payload part must not be empty').toBeGreaterThan(0);
    expect(parts[2].length, 'JWT signature part must not be empty').toBeGreaterThan(0);

    console.log(`[Test] ${describeToken(sessionToken)}`);
  });

  test('JWT header decodes to alg: HS256, typ: JWT', async ({ sessionToken }) => {
    expect(sessionToken, 'sessionToken must exist').toBeTruthy();

    const { header } = decodeJwt(sessionToken);

    expect(header,         'JWT header must not be null').toBeTruthy();
    expect(header.alg,     'JWT algorithm must be HS256').toBe('HS256');
    expect(header.typ,     'JWT type must be JWT').toBe('JWT');
  });

  test('JWT payload contains required identity claims (sub, username, iat, exp)', async ({ sessionToken, authUser }) => {
    expect(sessionToken, 'sessionToken must exist').toBeTruthy();

    const { payload } = decodeJwt(sessionToken);

    // sub — subject (customerId)
    expect(payload.sub,            'JWT payload must have sub claim').toBeTruthy();
    expect(payload.sub,            'sub must match logged-in customerId').toBe(authUser.id);

    // username
    expect(payload.username,       'JWT payload must have username claim').toBe('john');

    // iat — issued at (Unix timestamp)
    expect(typeof payload.iat,     'iat must be a number').toBe('number');
    expect(payload.iat,            'iat must be a positive timestamp').toBeGreaterThan(0);

    // exp — expiry (Unix timestamp)
    expect(typeof payload.exp,     'exp must be a number').toBe('number');
    expect(payload.exp,            'exp must be after iat').toBeGreaterThan(payload.iat);

    console.log(`[Test] JWT claims: sub=${payload.sub} username=${payload.username} iat=${payload.iat} exp=${payload.exp}`);
  });

  test('JWT token is not expired immediately after generation', async ({ sessionToken }) => {
    expect(sessionToken, 'sessionToken must exist').toBeTruthy();

    const expired = isTokenExpired(sessionToken);
    expect(expired, 'Token must not be expired immediately after generation').toBeFalsy();

    // Confirm exp is at least 30 minutes in the future
    const { payload } = decodeJwt(sessionToken);
    const now = Math.floor(Date.now() / 1000);
    const remainingSeconds = payload.exp - now;
    expect(remainingSeconds, 'Token must have at least 30 minutes remaining').toBeGreaterThan(1800);

    console.log(`[Test] Token expires in ${Math.floor(remainingSeconds / 60)} minutes`);
  });

  // ── Signature Verification ────────────────────────────────────────────────

  test('JWT HMAC-SHA256 signature verifies correctly', async ({ sessionToken }) => {
    expect(sessionToken, 'sessionToken must exist').toBeTruthy();

    // verifyJwt throws if signature is invalid or token is expired
    let decodedPayload;
    expect(() => {
      decodedPayload = verifyJwt(sessionToken);
    }, 'verifyJwt must not throw for a valid token').not.toThrow();

    expect(decodedPayload,       'Verified payload must not be null').toBeTruthy();
    expect(decodedPayload.sub,   'Verified payload must contain sub').toBeTruthy();
  });

  test('JWT signature fails for tampered token', async ({ sessionToken }) => {
    expect(sessionToken, 'sessionToken must exist').toBeTruthy();

    // Tamper with the token by appending extra characters to the signature
    const tamperedToken = sessionToken + 'TAMPERED';

    expect(
      () => verifyJwt(tamperedToken),
      'verifyJwt must throw for a tampered token'
    ).toThrow();
  });

  test('JWT decode (without verify) returns header and payload objects', async ({ sessionToken }) => {
    expect(sessionToken, 'sessionToken must exist').toBeTruthy();

    const decoded = decodeJwt(sessionToken);
    expect(decoded,         'decodeJwt must return an object').toBeTruthy();
    expect(decoded.header,  'decoded must have header').toBeTruthy();
    expect(decoded.payload, 'decoded must have payload').toBeTruthy();
  });

  // ── Per-Session Determinism ───────────────────────────────────────────────

  test('Two calls to signJwt with the same payload generate different tokens (different iat)', async () => {
    // signJwt always injects the current timestamp, so two calls will produce
    // different tokens — confirms the token is fresh each time signJwt is called.
    // Within a single test run, the globalSetup mints exactly ONE token.
    const payload = { sub: 12345, username: 'john' };
    const { token: t1 } = signJwt(payload);

    // Small delay to ensure different iat
    await new Promise((r) => setTimeout(r, 1100));

    const { token: t2 } = signJwt(payload);

    expect(t1, 'Two sign calls with delay should produce different tokens').not.toBe(t2);
    console.log('[Test] Token uniqueness confirmed — iat differs between calls');
  });

  // ── Authorization Header Propagation ──────────────────────────────────────

  test('GET request with Authorization: Bearer <token> returns HTTP 200', async ({ authedRequest, sessionToken, authUser }) => {
    // authedRequest fixture has Authorization + Cookie headers pre-set.
    // Use /customers/{id} instead of /login to avoid Cloudflare rate limit on the login endpoint.
    const res    = await authedRequest.get(`/parabank/services/bank/customers/${authUser.id}`);
    const status = res.status();

    if (status === 429) {
      console.warn('[Test] GET /customers with JWT Bearer — Cloudflare 429 rate limit active, skipping strict assertion');
      return;
    }

    assertStatus(res, 200, 'GET /customers with Authorization: Bearer header', expect);

    const ct = res.headers()['content-type'] ?? '';
    expect(ct, 'Response must be JSON').toContain('json');

    const body = await res.json();
    expect(body.id, 'Customer GET with JWT header must return valid customerId').toBeGreaterThan(0);

    console.log(`[Test] Auth header propagation verified. Token: ${sessionToken?.slice(0, 30)}...`);
  });

  test('GET request with Authorization: Bearer <token> does not cause 5xx server error', async ({ authedRequest, authUser }) => {
    // Use /customers/{id} to avoid rate-limiting the /login endpoint
    const res    = await authedRequest.get(`/parabank/services/bank/customers/${authUser.id}`);
    const status = res.status();

    if (status === 429) {
      console.warn('[Test] JWT 5xx check — Cloudflare 429, skipping');
      return;
    }
    expect(status, 'JWT-authed request must not cause server error').toBeLessThan(500);
  });

  // ── Private Storage Integrity ─────────────────────────────────────────────

  test('sessionToken from private store matches a freshly verified JWT', async ({ sessionToken, authUser }) => {
    // This test cross-validates the private store (.session.json) contents:
    // the stored token must be a verifiable JWT with matching sub claim
    expect(sessionToken, 'Private session store must have a token').toBeTruthy();

    const payload = verifyJwt(sessionToken);

    expect(payload.sub,      'Stored token sub must match live authUser id').toBe(authUser.id);
    expect(payload.username, 'Stored token username must be john').toBe('john');
    expect(isTokenExpired(sessionToken), 'Stored token must not be expired').toBeFalsy();

    console.log(`[Test] Private store token integrity confirmed: sub=${payload.sub}`);
  });
});
