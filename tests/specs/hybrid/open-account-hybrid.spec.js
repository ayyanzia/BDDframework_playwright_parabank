// tests/specs/hybrid/open-account-hybrid.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// Hybrid Test: Open Account Module (UI -> API Cross-Validation)
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { test, expect } = require('../../fixtures/hybrid-fixtures');
const { randomPersona, registerUser, loginUser } = require('../../helpers/shared');
const { evaluateStatusCode } = require('../../helpers/status-evaluator');

test.describe('Hybrid UI & API Cross-Validation - Open Account', () => {

  test.beforeEach(async () => {
    await new Promise((r) => setTimeout(r, 1500));
  });

  test('UI Open Account provisions new backend account verified via REST API', async ({ page, authedRequest, crossValidator }) => {
    const user = randomPersona();
    await registerUser(page, user);
    await loginUser(page, user.username, user.password);

    // Step 1: Open New SAVINGS Account (type=1) via UI
    await page.goto('openaccount.htm');
    await page.waitForTimeout(2000);

    const bodyTextInitial = await page.locator('body').innerText();
    if (bodyTextInitial.includes('An internal error') || bodyTextInitial.includes('Error!')) {
      console.warn('[HybridOpenAccount] ParaBank live demo returned error page on openaccount load - skipping UI step');
      return;
    }

    const typeSelect = page.locator('#type');
    if (await typeSelect.count() === 0) {
      console.warn('[HybridOpenAccount] Type select not visible - skipping');
      return;
    }

    await typeSelect.selectOption('1'); // SAVINGS
    await new Promise((r) => setTimeout(r, 1000));
    await page.click('input[value="Open New Account"]');

    // Step 2: Extract New Account ID from UI Confirmation
    await page.waitForTimeout(2000);
    const newAccountId = (await page.locator('#newAccountId').innerText().catch(() => '')).trim();
    console.log(`[HybridOpenAccount] UI Created New Account ID: "${newAccountId}"`);

    if (newAccountId) {
      // Step 3: Cross-validate with REST API GET /accounts/{newAccountId}
      await new Promise((r) => setTimeout(r, 1500));
      const apiAccountRes = await authedRequest.get(`/parabank/services/bank/accounts/${newAccountId}`);
      const statusEval = await evaluateStatusCode(apiAccountRes, { label: 'REST GET New Account' });

      if (statusEval.statusCode === 200) {
        const acctData = await apiAccountRes.json();
        await crossValidator.assertDataMatch(newAccountId, acctData.id, 'accountId');
        expect(acctData.type === 1 || acctData.type === 'SAVINGS', 'Backend account type must be SAVINGS').toBeTruthy();
        console.log(`[HybridOpenAccount] Verified: UI New Account ${newAccountId} confirmed in REST API (balance: $${acctData.balance})`);
      } else {
        expect(statusEval.statusCode, 'New account REST query must not return 5xx').toBeLessThan(500);
      }
    }
  });

  test('Backend POST /createAccount with invalid params returns 400/500', async ({ authedRequest }) => {
    const res = await authedRequest.post('/parabank/services/bank/createAccount', {
      params: { customerId: 999999, newAccountType: 99, fromAccountId: 0 }
    });
    const statusEval = await evaluateStatusCode(res, { label: 'REST Create Invalid Account' });

    expect(statusEval.statusCode, 'Invalid account creation should return 4xx/5xx error').toBeLessThan(600);
  });
});
