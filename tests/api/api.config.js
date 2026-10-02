// tests/api/api.config.js
// ─────────────────────────────────────────────────────────────────────────────
// Dedicated Playwright configuration for the ParaBank API Testing project.
// No browser is launched — all tests use the built-in `request` fixture or
// custom APIRequestContext from fixtures/api-fixtures.js.
//
// Run: npm run test:api
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const path = require('path');
const { defineConfig } = require('@playwright/test');

// Base URL for the built-in `request` fixture used in individual spec files.
// The worker-scoped workerRequest fixture in api-fixtures.js uses the
// app root (parabank.parasoft.com) because it constructs its own context.
const BASE_URL =
  process.env.PARABANK_API_URL ||
  'https://parabank.parasoft.com/parabank/services/bank/';

module.exports = defineConfig({
  // ── Discovery ──────────────────────────────────────────────────────────────
  testDir: path.join(__dirname, 'specs'),
  testMatch: ['**/*.api.spec.js'],

  // ── Global Setup ───────────────────────────────────────────────────────────
  // Runs ONCE before all tests:
  //   1. POST /initializeDB  — seeds demo DB so john/demo exists
  //   2. Verifies GET /login/john/demo returns a valid Customer
  // This guards against periodic ParaBank demo server DB resets.
  globalSetup: path.join(__dirname, 'global-setup.js'),

  // ── Execution ──────────────────────────────────────────────────────────────
  // Serial: tests share account state (balances). Worker-scoped authUser
  // means login is called ONCE per run, not once per test (prevents 429).
  fullyParallel: false,
  workers: 1,
  retries: 0,                   // Single-pass execution (singleton fixture caches auth)
  timeout: 120_000,             // 120s per test (accommodates 32s Cloudflare 429 wait)
  expect: { timeout: 15_000 }, // 15s for assertions

  // ── Reporting ─────────────────────────────────────────────────────────────
  // Output folder is OUTSIDE the specs dir to avoid the "output clashes
  // with testDir" warning that Playwright emits if they overlap.
  outputDir: path.join(__dirname, '../../test-results/api/artifacts'),
  reporter: [
    ['list'],
    ['json',   { outputFile: path.join(__dirname, '../../test-results/api/results.json') }],
    ['html',   { outputFolder: path.join(__dirname, '../../test-results/api/html-report'), open: 'never' }],
  ],

  // ── Shared request context settings ────────────────────────────────────────
  use: {
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      'Accept':       'application/json',
      'Content-Type': 'application/json',
    },
    // Capture traces on failure so failing API calls can be inspected
    trace: 'retain-on-failure',
  },

  // ── No browser projects — pure HTTP ────────────────────────────────────────
  // No `projects` array = Playwright uses just the request fixture + HTTP client.
});
