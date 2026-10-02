// tests/api/global-setup.js
// ─────────────────────────────────────────────────────────────────────────────
// Playwright Global Setup for the ParaBank API test suite.
//
// Runs ONCE before all tests:
//   1. POST /initializeDB  — seeds demo DB
//   2. GET  /login/john/demo — authenticate & get Customer object
//   3. Sign a JWT session token from the authenticated user's claims
//   4. Capture Set-Cookie header for session cookie propagation
//   5. Persist session data + JWT + cookie to .session.json (private storage)
//
// All fixtures read from .session.json — zero additional login HTTP calls.
//
// Rate-Limit Strategy:
//   Cloudflare (error 1015) throttles the ParaBank public demo server.
//   Each step uses exponential backoff with up to MAX_RETRIES attempts.
//   Waits: 35s → 70s → 140s (capped at 120s) between retries.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const path = require('path');
const { request } = require('@playwright/test');
const { signJwt, describeToken } = require('./helpers/jwt-helper');

const BASE_URL     = process.env.PARABANK_API_URL || 'https://parabank.parasoft.com';
const API_BASE     = '/parabank/services/bank';
const SESSION_FILE = path.join(__dirname, '.session.json');

const MAX_RETRIES  = 5;     // up to 5 total attempts per step
const BASE_WAIT_MS = 35_000; // 35s initial wait (Cloudflare retry_after = 30s + buffer)
const MAX_WAIT_MS  = 120_000; // 120s maximum wait between retries

/**
 * Execute an HTTP call with exponential backoff on 429.
 * @param {Function} fn   — async function returning an APIResponse
 * @param {string}   label — human-readable label for logging
 * @returns {Promise<APIResponse>}
 */
async function withRetry(fn, label) {
  let waitMs = BASE_WAIT_MS;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fn();
    if (res.status() !== 429) return res;

    if (attempt < MAX_RETRIES) {
      const secs = Math.round(waitMs / 1000);
      console.warn(`[GlobalSetup] 429 on ${label} (attempt ${attempt}/${MAX_RETRIES}) — waiting ${secs}s...`);
      await new Promise((r) => setTimeout(r, waitMs));
      waitMs = Math.min(waitMs * 2, MAX_WAIT_MS); // exponential backoff, capped
    } else {
      console.error(`[GlobalSetup] ${label} still 429 after ${MAX_RETRIES} attempts. Giving up.`);
    }
  }
  // Return last response (caller decides what to do with 429 final result)
  return fn();
}

module.exports = async function globalSetup() {
  const ctx = await request.newContext({
    baseURL:          BASE_URL,
    extraHTTPHeaders: { 'Accept': 'application/json' },
  });

  try {
    // ── Step 1: Reset & seed the demo database ──────────────────────────────
    console.log('\n[GlobalSetup] Resetting & seeding ParaBank DB (POST /initializeDB)...');
    const initRes = await withRetry(
      () => ctx.post(`${API_BASE}/initializeDB`),
      'initializeDB'
    );
    console.log(`[GlobalSetup]    initializeDB → HTTP ${initRes.status()}`);
    await new Promise((r) => setTimeout(r, 3000));

    // ── Step 2: Authenticate ────────────────────────────────────────────────
    console.log('[GlobalSetup] Logging in john/demo for live customer data...');
    const loginRes = await withRetry(
      () => ctx.get(`${API_BASE}/login/john/demo`),
      'login'
    );

    if (!loginRes.ok()) {
      throw new Error(`[GlobalSetup] Login failed after retries: HTTP ${loginRes.status()} ${await loginRes.text()}`);
    }

    const user = await loginRes.json();
    console.log(`[GlobalSetup] Live login succeeded — customerId: ${user.id} (${user.firstName} ${user.lastName})`);

    // ── Step 3: Mint one JWT session token per run ──────────────────────────
    // JWT payload contains only the authenticated user's identity claims.
    // The token is NOT derived from hashing the login response body —
    // it is a fresh standard JWT signed with the app's HMAC secret.
    const { token: sessionToken, iat, exp } = signJwt({
      sub:      user.id,
      username: 'john',
      role:     'qa-automation',
    });
    console.log(`[GlobalSetup] JWT session token minted — ${describeToken(sessionToken)}`);

    // ── Step 4: Capture Set-Cookie header (session cookie) ──────────────────
    const rawHeaders    = loginRes.headers();
    const sessionCookie = rawHeaders['set-cookie'] || rawHeaders['Set-Cookie'] || null;
    if (sessionCookie) {
      console.log(`[GlobalSetup] Session cookie captured: ${String(sessionCookie).slice(0, 80)}...`);
    } else {
      console.log('[GlobalSetup] No Set-Cookie header in login response (ParaBank may use stateless REST).');
    }

    // ── Step 5: Fetch live accounts ─────────────────────────────────────────
    const acctsRes = await withRetry(
      () => ctx.get(`${API_BASE}/customers/${user.id}/accounts`),
      'accounts fetch'
    );
    const accounts = acctsRes.ok() ? await acctsRes.json() : [];
    console.log(`[GlobalSetup] Fetched ${accounts.length} live accounts for customerId ${user.id}`);

    // ── Step 6: Persist private session store (.session.json) ───────────────
    // .session.json is the PRIVATE STORAGE for this test session.
    // It holds the JWT token, session cookie, and live customer/account data.
    // Never commit this file to version control (already in .gitignore).
    const sessionData = {
      user,
      accounts,
      timestamp:    Date.now(),
      sessionToken,          // signed JWT — one per test run
      sessionCookie,         // raw Set-Cookie header value (may be null)
      tokenClaims: {
        iat,
        exp,
        sub:      user.id,
        username: 'john',
      },
    };

    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2), 'utf-8');
    console.log(`[GlobalSetup] Private session saved to ${SESSION_FILE}`);
    console.log('[GlobalSetup] API suite ready.\n');

  } finally {
    await ctx.dispose();
  }
};
