// framework/utils/FakerHelper.js
// ─────────────────────────────────────────────────────────────────────────────
// PROJECT-AGNOSTIC generic test data generator.
// Wraps @faker-js/faker with domain-neutral helpers that any project can use.
// Never contains project-specific fields (no ParaBank-specific keys here).
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { faker } = require('@faker-js/faker');

const FakerHelper = {
  // ── Strings ──────────────────────────────────────────────────────────────────

  /**
   * Random alphanumeric string of given length.
   * @param {number} len
   * @returns {string}
   */
  randomString: (len = 8) => faker.string.alphanumeric({ length: len }),

  /**
   * Random alphabetic-only string of given length.
   * @param {number} len
   * @returns {string}
   */
  randomAlpha: (len = 8) => faker.string.alpha({ length: len }),

  /**
   * Random numeric string of given length.
   * @param {number} len
   * @returns {string}
   */
  randomNumeric: (len = 8) => faker.string.numeric(len),

  /**
   * Generate a unique timestamp suffix (last 6 digits of Date.now()).
   * @returns {string}
   */
  randomTimestampSuffix: () => Date.now().toString().slice(-6),

  // ── Identity ─────────────────────────────────────────────────────────────────

  /** @returns {string} */
  randomFirstName: () => faker.person.firstName(),

  /** @returns {string} */
  randomLastName:  () => faker.person.lastName(),

  /**
   * Random unique username — URL-safe lowercase + timestamp suffix.
   * @param {string} [prefix='qa']
   * @returns {string}
   */
  randomUsername: (prefix = 'qa') =>
    `${prefix}_${faker.internet.username().replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}_${Date.now().toString().slice(-6)}`,

  /**
   * Random email address.
   * @returns {string}
   */
  randomEmail: () => faker.internet.email(),

  /**
   * Strong password meeting common complexity rules.
   * Format: Qa + 6 alphanumeric + #1
   * @returns {string}
   */
  randomPassword: () => `Qa${faker.string.alphanumeric({ length: 6 })}#1`,

  // ── Contact / Address ─────────────────────────────────────────────────────────

  /** @returns {string} */
  randomStreetAddress: () => faker.location.streetAddress(),

  /** @returns {string} */
  randomCity: () => faker.location.city(),

  /**
   * Random state.
   * @param {boolean} [abbreviated=false]
   * @returns {string}
   */
  randomState: (abbreviated = false) => faker.location.state({ abbreviated }),

  /**
   * Random ZIP code.
   * @param {string} [format='#####']
   * @returns {string}
   */
  randomZip: (format = '#####') => faker.location.zipCode(format),

  /**
   * Random phone number (numeric digits only).
   * @param {number} [len=10]
   * @returns {string}
   */
  randomPhone: (len = 10) => faker.string.numeric(len),

  /**
   * Random SSN in XXX-XX-XXXX format.
   * @returns {string}
   */
  randomSSN: () =>
    `${faker.string.numeric(3)}-${faker.string.numeric(2)}-${faker.string.numeric(4)}`,

  // ── Finance ───────────────────────────────────────────────────────────────────

  /**
   * Random dollar amount as a string (e.g., "142.50").
   * @param {number} [min=5]
   * @param {number} [max=500]
   * @param {number} [dec=2]
   * @returns {string}
   */
  randomAmount: (min = 5, max = 500, dec = 2) =>
    faker.finance.amount({ min, max, dec }),

  /**
   * Random account number (8 numeric digits).
   * @returns {string}
   */
  randomAccountNumber: () => faker.string.numeric(8),

  // ── Company ───────────────────────────────────────────────────────────────────

  /**
   * Random company name, trimmed to given max length.
   * @param {number} [maxLen=20]
   * @returns {string}
   */
  randomCompanyName: (maxLen = 20) => faker.company.name().slice(0, maxLen),

  // ── Misc ──────────────────────────────────────────────────────────────────────

  /**
   * Pick a random element from an array.
   * @template T
   * @param {T[]} arr
   * @returns {T}
   */
  randomArrayElement: (arr) => faker.helpers.arrayElement(arr),

  /**
   * Random invalid / boundary text for negative testing.
   * @returns {string}
   */
  randomInvalidText: () =>
    faker.helpers.arrayElement(['1234', 'abcd!!', '####', '   ', 'N/A-??']),

  /** Expose faker directly for advanced use cases. */
  faker,
};

module.exports = FakerHelper;
