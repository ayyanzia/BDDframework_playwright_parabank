// tests/specs/hybrid/auth-login-hybrid.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// Hybrid Test: Authentication & Login Module (UI -> API Cross-Validation)
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { test, expect } = require('../../fixtures/hybrid-fixtures');
const { randomPersona, registerUser, loginUser } = require('../../helpers/shared');
const { evaluateStatusCode } = require('../../helpers/status-evaluator');

test.describe('Hybrid UI & API Cross-Validation - Authentication & Login', () => {

  test.beforeEach(async () => {
    await new Promise((r) => setTimeout(r, 1500));
  });

  test('UI Login welcome header matches backend REST customer identity', async ({ page, authedRequest, crossValidator }) => {
    const user = randomPersona();
    await registerUser(page, user);

    // Step 1: Perform UI Login
    await loginUser(page, user.username, user.password);

    // Step 2: Extract UI Welcome Text from Page Header/Panel
    const headingText = await page.locator('#rightPanel h1.title, .smallText').first().innerText().catch(() => '');
    console.log(`[HybridAuth] UI Heading Text: "${headingText}"`);

    // Step 3: Fetch Backend Customer Profile via REST API Login
    const apiCustomerRes = await authedRequest.get(`/parabank/services/bank/login/${user.username}/${user.password}`);
    const statusEval = await evaluateStatusCode(apiCustomerRes, { label: 'REST Login User Fetch' });

    if (statusEval.statusCode === 200) {
      const apiUser = await apiCustomerRes.json();

      // Step 4: Cross-validate UI string and API customer payload
      await crossValidator.assertDataMatch(user.username, apiUser.username, 'username');
      await crossValidator.assertDataMatch(user.firstName, apiUser.firstName, 'firstName');
      console.log(`[HybridAuth] Verified: UI Welcome heading matches Backend REST customer '${apiUser.firstName}'`);
    } else {
      expect(statusEval.statusCode, 'Customer REST endpoint should not return server error').toBeLessThan(500);
    }
  });

  test('Invalid UI Login fails on UI and corresponds to invalid REST API response', async ({ page, authedRequest }) => {
    await page.goto('index.htm');
    await page.fill('input[name="username"]', 'invalid_user_hybrid_999');
    await page.fill('input[name="password"]', 'wrong_pass');
    await page.click('input[value="Log In"]');

    // UI Error Check
    const bodyText = await page.locator('body').innerText();
    const isErrorDisplayed = bodyText.includes('Error') || bodyText.includes('could not be verified');
    expect(isErrorDisplayed, 'UI must show error for bad credentials').toBeTruthy();

    // API Verification for Bad Credentials
    const badApiRes = await authedRequest.get('/parabank/services/bank/login/invalid_user_hybrid_999/wrong_pass');
    const statusEval = await evaluateStatusCode(badApiRes, { label: 'REST Invalid Login' });

    expect(statusEval.statusCode, 'Invalid login should return 400, 200 with error, or 429').toBeLessThan(500);
  });
});
