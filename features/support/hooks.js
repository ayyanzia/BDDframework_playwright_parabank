// features/support/hooks.js
// ─────────────────────────────────────────────────────────────────────────────
// Cucumber lifecycle hooks.
// Browser setup/teardown now goes through BrowserManager (framework layer).
// The single shared browser session is preserved: one browser, one context,
// one page for the entire suite run.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { BeforeAll, AfterAll, Before, setDefaultTimeout } = require('@cucumber/cucumber');
const BrowserManager = require('../../framework/core/BrowserManager');
const { BASE_URL, registerUser, loginUser, randomPersona } = require('../../tests/helpers/shared');
const session = require('./session');

// 60-second default timeout for the slow ParaBank demo server.
setDefaultTimeout(60000);

BeforeAll(async () => {
  // ── Spin up the shared browser session via BrowserManager ──────────────────
  await BrowserManager.launch({ headless: process.env.HEADLESS !== 'false' });
  await BrowserManager.newContext({ baseURL: BASE_URL });
  const page = await BrowserManager.newPage();

  // ── Register and login the primary test user once for the entire run ───────
  const primaryUser = randomPersona();
  await registerUser(page, primaryUser);
  await loginUser(page, primaryUser.username, primaryUser.password);
  session.setPrimaryUser(primaryUser);
});

Before(function () {
  // Attach the shared page to each scenario's World context.
  this.page = session.getPage();
});

AfterAll(async () => {
  // Tear down in order: page → context → browser.
  await BrowserManager.teardown();
});
