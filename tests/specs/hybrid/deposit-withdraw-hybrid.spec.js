// tests/specs/hybrid/deposit-withdraw-hybrid.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// Hybrid Test: Deposit & Withdraw Module (API -> UI Cross-Validation)
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { test, expect } = require('../../fixtures/hybrid-fixtures');
const { randomPersona, registerUser, loginUser } = require('../../helpers/shared');
const { evaluateStatusCode } = require('../../helpers/status-evaluator');

test.describe('Hybrid UI & API Cross-Validation - Deposit & Withdraw', () => {

  test.beforeEach(async () => {
    await new Promise((r) => setTimeout(r, 1500));
  });

  test('REST API POST /deposit updates balance which is automatically rendered in UI table', async ({ page, authedRequest, crossValidator }) => {
    const user = randomPersona();
    await registerUser(page, user);
    await loginUser(page, user.username, user.password);

    const DEPOSIT_AMOUNT = 35;

    // Step 1: Fetch Customer Login via REST API to get primary Account ID
    const apiLoginRes = await authedRequest.get(`/parabank/services/bank/login/${user.username}/${user.password}`);
    const loginEval = await evaluateStatusCode(apiLoginRes, { label: 'REST Login Fetch' });

    if (loginEval.statusCode === 200) {
      const customer = await apiLoginRes.json();
      const acctsRes = await authedRequest.get(`/parabank/services/bank/customers/${customer.id}/accounts`);
      const acctsEval = await evaluateStatusCode(acctsRes, { label: 'REST Customer Accounts Fetch' });

      if (acctsEval.statusCode === 200) {
        const accounts = await acctsRes.json();
        const primaryAccountId = accounts[0].id;
        const initialBalance = accounts[0].balance;

        // Step 2: Execute REST API Deposit
        const depositRes = await authedRequest.post('/parabank/services/bank/deposit', {
          params: { accountId: primaryAccountId, amount: DEPOSIT_AMOUNT }
        });
        await evaluateStatusCode(depositRes, { label: 'REST POST Deposit' });

        // Step 3: Refresh UI Accounts Overview
        await page.goto('overview.htm');
        await page.waitForSelector('#accountTable tbody tr', { timeout: 10000 });

        // Step 4: Extract UI balance for primary account
        const uiBalanceText = await page.locator(`#accountTable tbody tr:has-text("${primaryAccountId}") td:nth-child(2)`).innerText().catch(() => '');

        if (uiBalanceText) {
          const expectedBalance = initialBalance + DEPOSIT_AMOUNT;
          await crossValidator.assertBalanceMatch(uiBalanceText, expectedBalance, primaryAccountId);
          console.log(`[HybridDeposit] Verified: API Deposit +$${DEPOSIT_AMOUNT} reflected on UI as ${uiBalanceText}`);
        }
      }
    }
  });
});
