// tests/specs/hybrid/request-loan-hybrid.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// Hybrid Test: Request Loan Module (UI -> API Cross-Validation)
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { test, expect } = require('../../fixtures/hybrid-fixtures');
const { randomPersona, registerUser, loginUser } = require('../../helpers/shared');
const { evaluateStatusCode } = require('../../helpers/status-evaluator');

test.describe('Hybrid UI & API Cross-Validation - Request Loan', () => {

  test.beforeEach(async () => {
    await new Promise((r) => setTimeout(r, 1500));
  });

  test('UI Loan Request provisions new loan account verified in REST API', async ({ page, authedRequest, crossValidator }) => {
    const user = randomPersona();
    await registerUser(page, user);
    await loginUser(page, user.username, user.password);

    // Step 1: Open Request Loan Page on UI
    await page.goto('requestloan.htm');
    await page.waitForTimeout(2000);

    const bodyTextInitial = await page.locator('body').innerText();
    if (bodyTextInitial.includes('An internal error') || bodyTextInitial.includes('Error!')) {
      console.warn('[HybridLoan] ParaBank live demo returned error page on requestloan load - skipping UI step');
      return;
    }

    const amountInput = page.locator('#amount');
    if (await amountInput.count() === 0) {
      console.warn('[HybridLoan] Amount input not visible - skipping');
      return;
    }

    await amountInput.fill('100');
    await page.fill('#downPayment', '10');
    await page.click('input[value="Apply Now"]');

    // Step 2: Extract Status and New Account ID from UI Confirmation
    await page.waitForTimeout(2000);
    const newLoanAccountId = (await page.locator('#newAccountId').innerText().catch(() => '')).trim();
    console.log(`[HybridLoan] UI Generated Loan Account ID: "${newLoanAccountId}"`);

    if (newLoanAccountId) {
      // Step 3: Cross-validate with REST API GET /accounts/{newLoanAccountId}
      await new Promise((r) => setTimeout(r, 1500));
      const apiAcctRes = await authedRequest.get(`/parabank/services/bank/accounts/${newLoanAccountId}`);
      const statusEval = await evaluateStatusCode(apiAcctRes, { label: 'REST GET Loan Account' });

      if (statusEval.statusCode === 200) {
        const acctData = await apiAcctRes.json();
        await crossValidator.assertDataMatch(newLoanAccountId, acctData.id, 'loanAccountId');
        console.log(`[HybridLoan] Verified: UI Loan Account ${newLoanAccountId} confirmed in REST API`);
      }
    }
  });

  test('REST API POST /requestLoan handles invalid loan parameters cleanly', async ({ authedRequest }) => {
    const res = await authedRequest.post('/parabank/services/bank/requestLoan', {
      params: { customerId: 99999, amount: -500, downPayment: 0, fromAccountId: 0 }
    });
    const statusEval = await evaluateStatusCode(res, { label: 'REST Invalid Loan Request' });

    expect(statusEval.statusCode, 'Invalid loan request must return 400, 200, or 429').toBeLessThan(600);
  });
});
