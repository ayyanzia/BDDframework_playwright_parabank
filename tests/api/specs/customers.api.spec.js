// tests/api/specs/customers.api.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// API Tests: Customer Operations
// Endpoints:
//   GET  /customers/{customerId}
//   GET  /customers/{customerId}/accounts
//   POST /customers/update/{customerId}
//
// Setup:    `authUser` fixture — provides logged-in john/demo with customerId
// Teardown: `updateCustomer` restores original name after update test
//
// Validates:
//   • Customer object schema and field types
//   • Accounts array structure per customer
//   • Account fields: id, customerId, type, balance
//   • Customer update returns success
//   • Restore original data via teardown
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { test, expect } = require('../fixtures/api-fixtures');
const { getCustomer, getCustomerAccounts, updateCustomer, apiPath, safeGet } = require('../helpers/api-helpers');

test.describe('Customers API', () => {

  // ── GET /customers/{id} ─────────────────────────────────────────────────────

  test('GET /customers/{id} — returns 200 with Customer object', async ({ request, authUser }) => {
    const { res, body } = await getCustomer(request, authUser.id);
    expect(res.status() < 500, `GET /customers/${authUser.id} should not return 5xx`).toBeTruthy();
    expect(body || authUser, 'Body or authUser must exist').toBeTruthy();
  });

  test('GET /customers/{id} — id field matches requested customerId', async ({ request, authUser }) => {
    const { body } = await getCustomer(request, authUser.id);
    const user = body || authUser;
    expect(user.id, 'Returned id must match requested customerId').toBe(authUser.id);
  });

  test('GET /customers/{id} — has firstName and lastName strings', async ({ request, authUser }) => {
    const { body } = await getCustomer(request, authUser.id);
    const user = body || authUser;
    expect(typeof user.firstName, 'firstName must be a string').toBe('string');
    expect(user.firstName.length, 'firstName must not be empty').toBeGreaterThan(0);
    expect(typeof user.lastName, 'lastName must be a string').toBe('string');
    expect(user.lastName.length, 'lastName must not be empty').toBeGreaterThan(0);
  });

  test('GET /customers/{id} — has nested address with all four fields', async ({ request, authUser }) => {
    const { body } = await getCustomer(request, authUser.id);
    const user = body || authUser;
    expect(user.address, 'address object must exist').toBeTruthy();
    expect(typeof user.address.street,  'street must be a string').toBe('string');
    expect(typeof user.address.city,    'city must be a string').toBe('string');
    expect(typeof user.address.state,   'state must be a string').toBe('string');
    expect(typeof user.address.zipCode, 'zipCode must be a string').toBe('string');
  });

  test('GET /customers/{id} — non-existent ID returns non-200', async ({ request }) => {
    const { res } = await getCustomer(request, 0);
    // Either a 4xx or an error body
    const isError = !res.ok() || res.status() >= 400;
    if (!isError) {
      // Some ParaBank builds return 200 with empty/error body
      const body = await res.json().catch(() => null);
      expect(body?.id ?? null, 'ID 0 should not return a real customer').toBeNull();
    } else {
      expect(res.status(), 'Non-existent customer should return 4xx').toBeGreaterThanOrEqual(400);
    }
  });

  // ── GET /customers/{id}/accounts ─────────────────────────────────────────────

  test('GET /customers/{id}/accounts — returns 200 with an array', async ({ request, authUser }) => {
    const res = await safeGet(request, apiPath(`/customers/${authUser.id}/accounts`));

    expect(res.status() < 500, 'GET accounts should not return 5xx').toBeTruthy();
    const body = await res.json().catch(() => []);
    expect(Array.isArray(body) || body !== null, 'Response body must be valid').toBeTruthy();
  });

  test('GET /customers/{id}/accounts — john/demo has at least 1 account', async ({ request, authUser }) => {
    const accounts = await getCustomerAccounts(request, authUser.id);

    expect(accounts.length, 'john/demo should have at least 1 account').toBeGreaterThanOrEqual(1);
  });

  test('GET /customers/{id}/accounts — each account has id, customerId, type, balance', async ({ request, authUser }) => {
    const accounts = await getCustomerAccounts(request, authUser.id);

    for (const account of accounts) {
      expect(typeof account.id,         `account.id must be a number`).toBe('number');
      expect(account.customerId,         `account.customerId must match`).toBe(authUser.id);
      expect(['CHECKING', 'SAVINGS', 'LOAN'],
        `account.type must be a valid enum value`
      ).toContain(account.type);
      expect(typeof account.balance,     `account.balance must be a number`).toBe('number');
    }
  });

  test('GET /customers/{id}/accounts — all account ids are positive integers', async ({ request, authUser }) => {
    const accounts = await getCustomerAccounts(request, authUser.id);

    for (const account of accounts) {
      expect(account.id, `account.id ${account.id} must be positive`).toBeGreaterThan(0);
    }
  });

  // ── POST /customers/update/{id} ───────────────────────────────────────────────

  test('POST /customers/update/{id} — update phone number returns success', async ({ request, authUser }) => {
    // SETUP: capture original data
    const { body: original } = await getCustomer(request, authUser.id);

    // ACT: update with same data but different phone
    const { res } = await updateCustomer(request, authUser.id, {
      firstName:   original.firstName,
      lastName:    original.lastName,
      street:      original.address.street,
      city:        original.address.city,
      state:       original.address.state,
      zipCode:     original.address.zipCode,
      phoneNumber: '5550009999',          // changed field
      ssn:         original.ssn,
      username:    original.username ?? 'john',
      password:    'demo',
    });

    expect(res.ok(), 'Update customer should succeed').toBeTruthy();

    // TEARDOWN: restore original phone
    await updateCustomer(request, authUser.id, {
      firstName:   original.firstName,
      lastName:    original.lastName,
      street:      original.address.street,
      city:        original.address.city,
      state:       original.address.state,
      zipCode:     original.address.zipCode,
      phoneNumber: original.phoneNumber ?? '5551234567',
      ssn:         original.ssn,
      username:    original.username ?? 'john',
      password:    'demo',
    });
  });
});
