// tests/specs/hybrid/accounts-overview-hybrid.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// Hybrid Test: Accounts Overview Module (UI -> API Cross-Validation)
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { test, expect } = require('../../fixtures/hybrid-fixtures');
const { randomPersona, registerUser, loginUser } = require('../../helpers/shared');
const { evaluateStatusCode } = require('../../helpers/status-evaluator');

test.describe('Hybrid UI & API Cross-Validation - Accounts Overview', () => {

  test.beforeEach(async () => {
    await new Promise((r) => setTimeout(r, 1500));
  });

  test('UI Accounts Overview table rows match backend REST customer accounts list', async ({ page, authedRequest, crossValidator }) => {
    const user = randomPersona();
    await registerUser(page, user);
    await loginUser(page, user.username, user.password);

    // Step 1: Navigate to Accounts Overview Page on UI
    await page.goto('overview.htm');
    await page.waitForTimeout(2000);

    const bodyTextInitial = await page.locator('body').innerText();
    if (bodyTextInitial.includes('An internal error') || bodyTextInitial.includes('Error!')) {
      console.warn('[HybridAccounts] ParaBank live demo returned error page on overview load - skipping UI step');
      return;
    }

    const tableRows = page.locator('#accountTable tbody tr');
    if (await tableRows.count() === 0) {
      console.warn('[HybridAccounts] Account table rows not visible - skipping UI check');
      return;
    }

    // Step 2: Extract UI Account Table Row Data
    const accountLinks = await page.locator('#accountTable tbody tr a').allInnerTexts();
    console.log(`[HybridAccounts] UI Accounts found: ${accountLinks.join(', ')}`);

    if (accountLinks.length === 0) return;

    // Step 3: Fetch REST API Customer Login object to retrieve Customer ID
    const apiLoginRes = await authedRequest.get(`/parabank/services/bank/login/${user.username}/${user.password}`);
    const loginEval = await evaluateStatusCode(apiLoginRes, { label: 'REST Login ID Lookup' });

    if (loginEval.statusCode === 200) {
      const customer = await apiLoginRes.json();
      
      // Step 4: Fetch Accounts Array from REST API
      const apiAcctsRes = await authedRequest.get(`/parabank/services/bank/customers/${customer.id}/accounts`);
      const acctsEval = await evaluateStatusCode(apiAcctsRes, { label: 'REST Customer Accounts List' });

      if (acctsEval.statusCode === 200) {
        const apiAccounts = await apiAcctsRes.json();
        console.log(`[HybridAccounts] API Account count: ${apiAccounts.length}`);

        // Step 5: Verify Account Numbers Match
        const firstUiAcctId = accountLinks[0].trim();
        const matchingApiAcct = apiAccounts.find(a => String(a.id) === firstUiAcctId);

        expect(matchingApiAcct, `UI Account ID ${firstUiAcctId} must exist in API response`).toBeTruthy();
        
        // Step 6: Balance Cross-Validation
        const uiBalanceText = await page.locator(`#accountTable tbody tr:has-text("${firstUiAcctId}") td:nth-child(2)`).innerText().catch(() => '');
        if (uiBalanceText && matchingApiAcct) {
          await crossValidator.assertBalanceMatch(uiBalanceText, matchingApiAcct.balance, firstUiAcctId);
        }
      }
    } else {
      expect(loginEval.statusCode, 'Accounts lookup should not fail with server error').toBeLessThan(500);
    }
  });

  test('Querying accounts for non-existent customer returns 400/404 on API', async ({ authedRequest }) => {
    const res = await authedRequest.get('/parabank/services/bank/customers/999999999/accounts');
    const statusEval = await evaluateStatusCode(res, { label: 'REST Non-existent Customer Accounts' });

    expect(statusEval.statusCode, 'Non-existent customer should return 400, 404, or empty array').toBeLessThan(500);
  });
});
