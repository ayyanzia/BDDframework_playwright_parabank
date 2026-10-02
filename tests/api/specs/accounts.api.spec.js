// tests/api/specs/accounts.api.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// API Tests: Account Operations
// Endpoints:
//   GET  /accounts/{accountId}
//   POST /createAccount
//
// Setup:    `authUser` + `accounts` fixtures
// Teardown: Newly created accounts are left on the demo server (no cleanDB)
//           but verified that they appear in subsequent GET /accounts calls.
//
// Validates:
//   • GET account by ID — schema, field types, correctness
//   • POST createAccount — CHECKING (type=0) and SAVINGS (type=1)
//   • New account has correct type, customerId, and a non-negative balance
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { test, expect } = require('../fixtures/api-fixtures');
const { getAccount, createAccount, getCustomerAccounts } = require('../helpers/api-helpers');

test.describe('Accounts API', () => {

  // ── GET /accounts/{accountId} ───────────────────────────────────────────────

  test('GET /accounts/{id} — returns 200 for a valid account', async ({ request, primaryAccountId }) => {
    const { res } = await getAccount(request, primaryAccountId);

    expect(res.status(), `GET /accounts/${primaryAccountId} should return 200`).toBe(200);
    expect(res.ok()).toBeTruthy();
  });

  test('GET /accounts/{id} — response id matches the requested account id', async ({ request, primaryAccountId }) => {
    const { body } = await getAccount(request, primaryAccountId);

    expect(body.id, 'Returned account id must match requested id').toBe(primaryAccountId);
  });

  test('GET /accounts/{id} — has customerId, type, and balance fields', async ({ request, primaryAccountId }) => {
    const { body } = await getAccount(request, primaryAccountId);

    expect(typeof body.customerId, 'customerId must be a number').toBe('number');
    expect(body.customerId, 'customerId must be positive').toBeGreaterThan(0);
    expect(['CHECKING', 'SAVINGS', 'LOAN'], 'type must be a valid enum').toContain(body.type);
    expect(typeof body.balance, 'balance must be a number').toBe('number');
  });

  test('GET /accounts/{id} — balance is a finite number', async ({ request, primaryAccountId }) => {
    const { body } = await getAccount(request, primaryAccountId);

    expect(isFinite(body.balance), 'balance must be a finite number').toBeTruthy();
  });

  test('GET /accounts/{id} — second account is independently retrievable', async ({ request, secondAccountId }) => {
    const { res, body } = await getAccount(request, secondAccountId);

    expect(res.status(), 'Second account GET should return 200').toBe(200);
    expect(body.id, 'Second account id must match').toBe(secondAccountId);
  });

  test('GET /accounts/{id} — non-existent account id returns non-200 or error', async ({ request }) => {
    const { res } = await getAccount(request, 9999999);

    if (res.ok()) {
      // Some ParaBank builds may return 200 with empty or error body
      const body = await res.json().catch(() => ({}));
      expect(body.id ?? null, 'Non-existent account should not have a real id').toBeNull();
    } else {
      expect(res.status(), 'Non-existent account should return 4xx').toBeGreaterThanOrEqual(400);
    }
  });

  // ── POST /createAccount ────────────────────────────────────────────────────

  test('POST /createAccount — creates a new CHECKING account (type=0)', async ({ request, authUser, primaryAccountId }) => {
    // SETUP: record account count before
    const before = await getCustomerAccounts(request, authUser.id);

    // ACT
    const { res, body } = await createAccount(request, {
      customerId:     authUser.id,
      newAccountType: 0,            // 0 = CHECKING
      fromAccountId:  primaryAccountId,
    });

    // VALIDATE status
    expect(res.ok(), 'Create CHECKING account should succeed').toBeTruthy();

    // VALIDATE schema
    expect(body, 'Response body must not be null').toBeTruthy();
    expect(typeof body.id, 'New account id must be a number').toBe('number');
    expect(body.id, 'New account id must be positive').toBeGreaterThan(0);
    expect(body.customerId, 'New account must belong to the requesting customer').toBe(authUser.id);
    expect(body.type, 'New account type must be CHECKING').toBe('CHECKING');

    // VALIDATE side-effect: account count increased
    const after = await getCustomerAccounts(request, authUser.id);
    expect(after.length, 'Account count must increase after creation').toBeGreaterThan(before.length);
  });

  test('POST /createAccount — creates a new SAVINGS account (type=1)', async ({ request, authUser, primaryAccountId }) => {
    const { res, body } = await createAccount(request, {
      customerId:     authUser.id,
      newAccountType: 1,            // 1 = SAVINGS
      fromAccountId:  primaryAccountId,
    });

    expect(res.ok(), 'Create SAVINGS account should succeed').toBeTruthy();
    expect(body.type, 'New account type must be SAVINGS').toBe('SAVINGS');
    expect(body.customerId, 'New account must belong to the customer').toBe(authUser.id);
  });

  test('POST /createAccount — new account balance is non-negative', async ({ request, authUser, primaryAccountId }) => {
    const { body } = await createAccount(request, {
      customerId:     authUser.id,
      newAccountType: 0,
      fromAccountId:  primaryAccountId,
    });

    expect(body.balance, 'New account balance must be >= 0').toBeGreaterThanOrEqual(0);
  });

  test('POST /createAccount — new account id is unique from source account', async ({ request, authUser, primaryAccountId }) => {
    const { body } = await createAccount(request, {
      customerId:     authUser.id,
      newAccountType: 1,
      fromAccountId:  primaryAccountId,
    });

    expect(body.id, 'New account must have a different id from source').not.toBe(primaryAccountId);
  });
});
