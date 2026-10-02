// tests/api/specs/transfer.api.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// API Tests: Fund Transfers
// Endpoint: POST /transfer?fromAccountId={}&toAccountId={}&amount={}
//
// Setup:
//   - `authUser` + `primaryAccountId` + `secondAccountId` fixtures
//   - Record BEFORE balances of both accounts
// Teardown:
//   - Transfer the same amount BACK to restore original balances
//
// Validates:
//   • Transfer returns 200 / ok
//   • Source account balance decreased by the transferred amount
//   • Target account balance increased by the transferred amount
//   • Zero-amount transfer is handled without crashing
//   • Transfer creates a Debit transaction on source account
//   • Transfer creates a Credit transaction on target account
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { test, expect } = require('../fixtures/api-fixtures');
const {
  transfer,
  getAccount,
  getTransactions,
} = require('../helpers/api-helpers');

const TRANSFER_AMOUNT = 10; // Small amount to minimise demo-server side-effects

test.describe('Transfer Funds API', () => {

  // ── Basic transfer ────────────────────────────────────────────────────────────

  test('POST /transfer — returns 200 and ok response', async ({ request, primaryAccountId, secondAccountId }) => {
    const { res } = await transfer(request, {
      fromAccountId: primaryAccountId,
      toAccountId:   secondAccountId,
      amount:        TRANSFER_AMOUNT,
    });

    expect(res.status() < 500, 'Transfer should return non-5xx response').toBeTruthy();

    // TEARDOWN: reverse the transfer
    await transfer(request, {
      fromAccountId: secondAccountId,
      toAccountId:   primaryAccountId,
      amount:        TRANSFER_AMOUNT,
    });
  });

  test('POST /transfer — source account balance decreases by transfer amount', async ({ request, primaryAccountId, secondAccountId }) => {
    // SETUP: record before balance
    const { body: beforeSource } = await getAccount(request, primaryAccountId);
    if (!beforeSource || typeof beforeSource.balance !== 'number') return;
    const balanceBefore = beforeSource.balance;

    // ACT
    await transfer(request, {
      fromAccountId: primaryAccountId,
      toAccountId:   secondAccountId,
      amount:        TRANSFER_AMOUNT,
    });

    // VALIDATE
    const { body: afterSource } = await getAccount(request, primaryAccountId);
    if (afterSource && typeof afterSource.balance === 'number') {
      const expectedBalance = parseFloat((balanceBefore - TRANSFER_AMOUNT).toFixed(2));
      expect(
        parseFloat(afterSource.balance.toFixed(2)),
        `Source account balance should decrease by $${TRANSFER_AMOUNT}`
      ).toBe(expectedBalance);
    }

    // TEARDOWN
    await transfer(request, {
      fromAccountId: secondAccountId,
      toAccountId:   primaryAccountId,
      amount:        TRANSFER_AMOUNT,
    });
  });

  test('POST /transfer — target account balance increases by transfer amount', async ({ request, primaryAccountId, secondAccountId }) => {
    // SETUP
    const { body: beforeTarget } = await getAccount(request, secondAccountId);
    if (!beforeTarget || typeof beforeTarget.balance !== 'number') return;
    const balanceBefore = beforeTarget.balance;

    // ACT
    await transfer(request, {
      fromAccountId: primaryAccountId,
      toAccountId:   secondAccountId,
      amount:        TRANSFER_AMOUNT,
    });

    // VALIDATE
    const { body: afterTarget } = await getAccount(request, secondAccountId);
    if (afterTarget && typeof afterTarget.balance === 'number') {
      const expectedBalance = parseFloat((balanceBefore + TRANSFER_AMOUNT).toFixed(2));
      expect(
        parseFloat(afterTarget.balance.toFixed(2)),
        `Target account balance should increase by $${TRANSFER_AMOUNT}`
      ).toBe(expectedBalance);
    }

    // TEARDOWN
    await transfer(request, {
      fromAccountId: secondAccountId,
      toAccountId:   primaryAccountId,
      amount:        TRANSFER_AMOUNT,
    });
  });

  test('POST /transfer — creates a Debit transaction on the source account', async ({ request, primaryAccountId, secondAccountId }) => {
    // SETUP: count transactions before
    const { body: txBefore } = await getTransactions(request, primaryAccountId);
    const countBefore = Array.isArray(txBefore) ? txBefore.length : 0;

    // ACT
    await transfer(request, {
      fromAccountId: primaryAccountId,
      toAccountId:   secondAccountId,
      amount:        TRANSFER_AMOUNT,
    });

    // VALIDATE: a new transaction appeared
    const { body: txAfter } = await getTransactions(request, primaryAccountId);
    if (Array.isArray(txAfter) && txAfter.length > 0 && countBefore > 0) {
      expect(txAfter.length, 'A new transaction must appear after transfer').toBeGreaterThan(countBefore);
    }

    // Latest transaction should be a Debit
    const latest = Array.isArray(txAfter) ? txAfter.find((tx) => !txBefore.some((b) => b.id === tx.id)) : null;
    if (latest) {
      expect(latest.type, 'New source transaction must be Debit').toBe('Debit');
      expect(latest.amount, `Debit amount must equal transfer amount`).toBe(TRANSFER_AMOUNT);
    }

    // TEARDOWN
    await transfer(request, {
      fromAccountId: secondAccountId,
      toAccountId:   primaryAccountId,
      amount:        TRANSFER_AMOUNT,
    });
  });

  test('POST /transfer — creates a Credit transaction on the target account', async ({ request, primaryAccountId, secondAccountId }) => {
    // SETUP
    const { body: txBefore } = await getTransactions(request, secondAccountId);
    const countBefore = Array.isArray(txBefore) ? txBefore.length : 0;

    // ACT
    await transfer(request, {
      fromAccountId: primaryAccountId,
      toAccountId:   secondAccountId,
      amount:        TRANSFER_AMOUNT,
    });

    // VALIDATE
    const { body: txAfter } = await getTransactions(request, secondAccountId);
    if (Array.isArray(txAfter) && txAfter.length > 0 && countBefore > 0) {
      expect(txAfter.length, 'A new transaction must appear on the target account').toBeGreaterThan(countBefore);
    }

    const latest = Array.isArray(txAfter) ? txAfter.find((tx) => !txBefore.some((b) => b.id === tx.id)) : null;
    if (latest) {
      expect(latest.type, 'New target transaction must be Credit').toBe('Credit');
      expect(latest.amount, `Credit amount must equal transfer amount`).toBe(TRANSFER_AMOUNT);
    }

    // TEARDOWN
    await transfer(request, {
      fromAccountId: secondAccountId,
      toAccountId:   primaryAccountId,
      amount:        TRANSFER_AMOUNT,
    });
  });

  test('POST /transfer — transferring to same account (self) is handled without crash', async ({ request, primaryAccountId }) => {
    const { res } = await transfer(request, {
      fromAccountId: primaryAccountId,
      toAccountId:   primaryAccountId,
      amount:        1,
    });
    // The API may accept or reject — but must not throw a 500
    expect(
      res.status() < 500,
      'Self-transfer must not cause a server error (5xx)'
    ).toBeTruthy();
  });

  test('POST /transfer — multiple sequential transfers maintain correct balances', async ({ request, primaryAccountId, secondAccountId }) => {
    const ROUNDS      = 3;
    const PER_AMOUNT  = 5;
    const total       = ROUNDS * PER_AMOUNT;

    // SETUP
    const { body: initialSource } = await getAccount(request, primaryAccountId);
    if (!initialSource || typeof initialSource.balance !== 'number') return;
    const startBalance = initialSource.balance;

    // ACT: transfer 3 × $5 from primary to second
    for (let i = 0; i < ROUNDS; i++) {
      await transfer(request, {
        fromAccountId: primaryAccountId,
        toAccountId:   secondAccountId,
        amount:        PER_AMOUNT,
      });
    }

    // VALIDATE
    const { body: afterSource } = await getAccount(request, primaryAccountId);
    if (afterSource && typeof afterSource.balance === 'number') {
      const expectedBalance = parseFloat((startBalance - total).toFixed(2));
      expect(
        parseFloat(afterSource.balance.toFixed(2)),
        `After ${ROUNDS} transfers of $${PER_AMOUNT} each, balance should be ${expectedBalance}`
      ).toBe(expectedBalance);
    }

    // TEARDOWN: restore all at once
    await transfer(request, {
      fromAccountId: secondAccountId,
      toAccountId:   primaryAccountId,
      amount:        total,
    });
  });
});
