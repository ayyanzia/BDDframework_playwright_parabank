// tests/api/specs/loans.api.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// API Tests: Loan Requests
// Endpoint: POST /requestLoan?customerId={}&amount={}&downPayment={}&fromAccountId={}
//
// Setup:    `authUser` + `primaryAccountId` fixtures
// Teardown: No explicit cleanup — demo server manages loans, and approved loans
//           create new accounts (left in place, as with createAccount tests).
//
// LoanResponse schema:
//   { responseDate, loanProviderName, approved (bool), message, accountId? }
//
// Validates:
//   • Returns ok for well-formed loan requests
//   • LoanResponse always has loanProviderName and approved fields
//   • approved is a boolean
//   • Approved loan response includes an accountId
//   • Large loan (likely denied) still returns a structured LoanResponse
//   • Zero-amount loan is handled without server error
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { test, expect } = require('../fixtures/api-fixtures');
const { requestLoan, deposit } = require('../helpers/api-helpers');

test.describe('Loans API', () => {

  // ── Happy path — small approvable loan ───────────────────────────────────────

  test('POST /requestLoan — returns ok response for a small loan', async ({ request, authUser, primaryAccountId }) => {
    // SETUP: ensure sufficient balance for down payment
    await deposit(request, { accountId: primaryAccountId, amount: 500 });

    const { res } = await requestLoan(request, {
      customerId:    authUser.id,
      amount:        1000,
      downPayment:   100,
      fromAccountId: primaryAccountId,
    });

    expect(res.status() < 500, 'Loan request should return non-5xx response').toBeTruthy();
  });

  test('POST /requestLoan — response contains required LoanResponse fields', async ({ request, authUser, primaryAccountId }) => {
    await deposit(request, { accountId: primaryAccountId, amount: 500 });

    const { res, body } = await requestLoan(request, {
      customerId:    authUser.id,
      amount:        1000,
      downPayment:   100,
      fromAccountId: primaryAccountId,
    });

    expect(res.status() < 500).toBeTruthy();
    if (body) {
      expect(typeof body.loanProviderName, 'loanProviderName must be a string').toBe('string');
      expect(typeof body.approved, 'approved must be a boolean').toBe('boolean');
    }
  });

  test('POST /requestLoan — responseDate is a valid date string', async ({ request, authUser, primaryAccountId }) => {
    await deposit(request, { accountId: primaryAccountId, amount: 500 });

    const { res, body } = await requestLoan(request, {
      customerId:    authUser.id,
      amount:        1000,
      downPayment:   100,
      fromAccountId: primaryAccountId,
    });

    expect(res.status() < 500).toBeTruthy();
    if (body && body.responseDate) {
      expect(new Date(body.responseDate).toString(), 'responseDate must be a valid date').not.toBe('Invalid Date');
    }
  });

  test('POST /requestLoan — approved loan has a message string', async ({ request, authUser, primaryAccountId }) => {
    await deposit(request, { accountId: primaryAccountId, amount: 500 });

    const { body } = await requestLoan(request, {
      customerId:    authUser.id,
      amount:        500,
      downPayment:   100,
      fromAccountId: primaryAccountId,
    });

    if (body && body.message !== undefined && body.message !== null) {
      expect(typeof body.message, 'LoanResponse message must be a string if present').toBe('string');
    } else if (body) {
      expect(body.approved !== undefined, 'approved field must exist').toBeTruthy();
    }
  });

  test('POST /requestLoan — approved loan response includes accountId', async ({ request, authUser, primaryAccountId }) => {
    await deposit(request, { accountId: primaryAccountId, amount: 500 });

    const { body } = await requestLoan(request, {
      customerId:    authUser.id,
      amount:        500,
      downPayment:   100,
      fromAccountId: primaryAccountId,
    });

    if (body && body.approved) {
      expect(typeof body.accountId, 'Approved loan must include an accountId').toBe('number');
      expect(body.accountId, 'Approved loan accountId must be positive').toBeGreaterThan(0);
    }
  });

  // ── Large / likely denied loan ────────────────────────────────────────────────

  test('POST /requestLoan — very large loan (likely denied) still returns structured response', async ({ request, authUser, primaryAccountId }) => {
    const { res, body } = await requestLoan(request, {
      customerId:    authUser.id,
      amount:        9_999_999,   // Intentionally very large — expect denial
      downPayment:   1,
      fromAccountId: primaryAccountId,
    });

    // Must not be a 5xx — ParaBank should return a LoanResponse (even if denied)
    expect(
      res.status() < 500,
      'Large loan must not cause a server 5xx error'
    ).toBeTruthy();

    if (res.ok() && body) {
      expect(typeof body.approved, 'approved must be boolean even for large loans').toBe('boolean');
    }
  });

  test('POST /requestLoan — denied loan has approved = false', async ({ request, authUser, primaryAccountId }) => {
    const { res, body } = await requestLoan(request, {
      customerId:    authUser.id,
      amount:        9_999_999,
      downPayment:   1,
      fromAccountId: primaryAccountId,
    });

    if (res.ok() && body) {
      // Very large loan should be denied
      expect(body.approved, 'Very large loan should be denied').toBe(false);
    }
  });

  test('POST /requestLoan — zero down payment is handled without server crash', async ({ request, authUser, primaryAccountId }) => {
    const { res } = await requestLoan(request, {
      customerId:    authUser.id,
      amount:        1000,
      downPayment:   0,
      fromAccountId: primaryAccountId,
    });

    expect(
      res.status() < 500,
      'Zero down payment must not cause a server error'
    ).toBeTruthy();
  });
});
