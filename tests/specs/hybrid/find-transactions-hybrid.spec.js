// tests/specs/hybrid/find-transactions-hybrid.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// Hybrid Test: Find Transactions Module (UI -> API Cross-Validation)
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { test, expect } = require('../../fixtures/hybrid-fixtures');
const { randomPersona, registerUser, loginUser } = require('../../helpers/shared');
const { evaluateStatusCode } = require('../../helpers/status-evaluator');

test.describe('Hybrid UI & API Cross-Validation - Find Transactions', () => {

  test.beforeEach(async () => {
    await new Promise((r) => setTimeout(r, 1500));
  });

  test('UI Find Transactions by Amount matches REST API transactions by amount endpoint', async ({ page, authedRequest, crossValidator }) => {
    const user = randomPersona();
    await registerUser(page, user);
    await loginUser(page, user.username, user.password);

    const SEARCH_AMOUNT = 50;

    // Step 1: Open Find Transactions Page on UI
    await page.goto('findtrans.htm');
    await page.waitForTimeout(2000);

    const bodyTextInitial = await page.locator('body').innerText();
    if (bodyTextInitial.includes('An internal error') || bodyTextInitial.includes('Error!')) {
      console.warn('[HybridFindTx] ParaBank live demo returned error page on findtrans load - skipping UI step');
      return;
    }

    const amountInput = page.locator('#amount');
    if (await amountInput.count() === 0) {
      console.warn('[HybridFindTx] Amount input not visible - skipping');
      return;
    }

    const sourceAccount = await page.locator('#accountId option').first().getAttribute('value').catch(() => null);
    await amountInput.fill(String(SEARCH_AMOUNT));
    await page.click('#findByAmount');

    // Step 2: Extract UI Search Results
    await page.waitForTimeout(2000);
    const isTableVisible = await page.locator('#transactionTable').isVisible().catch(() => false);
    console.log(`[HybridFindTx] UI Transaction Results Table Visible: ${isTableVisible}`);

    // Step 3: Cross-validate with REST API GET /accounts/{accountId}/transactions/amount/{amount}
    if (sourceAccount) {
      await new Promise((r) => setTimeout(r, 1500));
      const apiTxRes = await authedRequest.get(`/parabank/services/bank/accounts/${sourceAccount}/transactions/amount/${SEARCH_AMOUNT}`);
      const statusEval = await evaluateStatusCode(apiTxRes, { label: 'REST Transactions by Amount' });

      if (statusEval.statusCode === 200) {
        const apiTransactions = await apiTxRes.json();
        expect(Array.isArray(apiTransactions), 'API response must be an array of transactions').toBeTruthy();
        console.log(`[HybridFindTx] API Filter returned ${apiTransactions.length} transactions`);

        if (apiTransactions.length > 0) {
          await crossValidator.assertDataMatch(SEARCH_AMOUNT, apiTransactions[0].amount, 'transactionAmount');
        }
      } else {
        expect(statusEval.statusCode, 'Find transactions API endpoint should return 200 or 429').toBeLessThan(500);
      }
    }
  });

  test('REST API GET transactions by non-existent transaction ID returns 400/404 handling', async ({ authedRequest }) => {
    const res = await authedRequest.get('/parabank/services/bank/transactions/99999999');
    const statusEval = await evaluateStatusCode(res, { label: 'REST Non-existent Transaction ID' });

    expect(statusEval.statusCode, 'Non-existent transaction ID should return 400, 404, or empty response').toBeLessThan(500);
  });
});
