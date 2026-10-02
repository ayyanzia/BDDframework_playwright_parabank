// data/data-generators.js
// ─────────────────────────────────────────────────────────────────────────────
// ParaBank-specific data generators.
// Re-exports from framework/utils/FakerHelper and assembles ParaBank-specific
// composite objects (personas, payees, etc.) from generic framework helpers.
// Backwards-compatible: all existing imports of randomPersona, randomAmount, etc. still work.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const FakerHelper = require('../framework/utils/FakerHelper');

// ── ParaBank persona (registration profile) ───────────────────────────────────

/** A fresh, valid registration profile with a guaranteed-unique username. */
function randomPersona() {
  return {
    firstName: FakerHelper.randomFirstName(),
    lastName:  FakerHelper.randomLastName(),
    street:    FakerHelper.randomStreetAddress(),
    city:      FakerHelper.randomCity(),
    state:     FakerHelper.randomState(true),
    zipCode:   FakerHelper.randomZip(),
    phone:     FakerHelper.randomPhone(10),
    ssn:       FakerHelper.randomSSN(),
    username:  FakerHelper.randomUsername('qa'),
    password:  FakerHelper.randomPassword(),
  };
}

// ── Financial helpers ─────────────────────────────────────────────────────────

/**
 * A random valid dollar amount string (e.g. "142.50").
 * @param {number} [min=5]
 * @param {number} [max=500]
 * @returns {string}
 */
function randomAmount(min = 5, max = 500) {
  return FakerHelper.randomAmount(min, max);
}

// ── Bill Pay payee ────────────────────────────────────────────────────────────

/** A random valid bill-pay payee object. */
function randomPayee() {
  return {
    name:          FakerHelper.randomCompanyName(20),
    street:        FakerHelper.randomStreetAddress(),
    city:          FakerHelper.randomCity(),
    state:         FakerHelper.randomState(true),
    zipCode:       FakerHelper.randomZip(),
    phone:         FakerHelper.randomPhone(10),
    accountNumber: FakerHelper.randomAccountNumber(),
  };
}

// ── Negative-path testing ─────────────────────────────────────────────────────

/** A random malformed/invalid string for negative-path testing. */
function randomInvalidText() {
  return FakerHelper.randomInvalidText();
}

module.exports = {
  randomPersona,
  randomAmount,
  randomPayee,
  randomInvalidText,
  faker: FakerHelper.faker,
};