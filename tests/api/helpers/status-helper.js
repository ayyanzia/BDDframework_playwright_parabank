// tests/api/helpers/status-helper.js
// ─────────────────────────────────────────────────────────────────────────────
// HTTP Status Code assertion helpers for the ParaBank API test suite.
//
// PURPOSE:
//   Centralises status code checks so every spec can assert exact codes
//   (200, 201, 400, 500) and response-body-level errors (200-with-error).
//
// ParaBank Quirk:
//   ParaBank is a legacy demo REST API that sometimes returns HTTP 200 with
//   an error message in the body instead of a proper 4xx/5xx code.
//   The helpers below detect and surface these "false-200" cases.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

/**
 * HTTP reason phrases for common codes (for readable test logs).
 */
const REASON_PHRASES = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
};

/**
 * Format a status assertion label for test output.
 * @param {number} actual
 * @param {number|number[]} expected
 * @param {string} [label]
 */
function formatLabel(actual, expected, label = '') {
  const expectedStr = Array.isArray(expected) ? expected.join(' or ') : expected;
  const actualReason = REASON_PHRASES[actual] || '';
  return `${label ? label + ' — ' : ''}Expected HTTP ${expectedStr}, got ${actual} ${actualReason}`.trim();
}

/**
 * Assert an exact HTTP status code.
 * Logs the actual response status for debugging.
 *
 * @param {import('@playwright/test').APIResponse} res
 * @param {number} expected - Expected HTTP status code
 * @param {string} [label]
 * @param {import('@playwright/test').Expect} expect - Playwright expect function
 */
function assertStatus(res, expected, label, expect) {
  const actual = res.status();
  console.log(`[Status] ${label || ''} → HTTP ${actual} ${REASON_PHRASES[actual] || ''}`);
  expect(actual, formatLabel(actual, expected, label)).toBe(expected);
}

/**
 * Assert the response belongs to a status class.
 * classCode: 2 → 2xx, 4 → 4xx, 5 → 5xx
 *
 * @param {import('@playwright/test').APIResponse} res
 * @param {2|4|5} classCode
 * @param {string} [label]
 * @param {import('@playwright/test').Expect} expect
 */
function assertStatusClass(res, classCode, label, expect) {
  const actual = res.status();
  const floor  = classCode * 100;
  const ceil   = floor + 99;
  console.log(`[Status] ${label || ''} → HTTP ${actual} (expected ${floor}-${ceil})`);
  expect(
    actual >= floor && actual <= ceil,
    `${label ? label + ' — ' : ''}Expected HTTP ${floor}-${ceil}, got ${actual} ${REASON_PHRASES[actual] || ''}`
  ).toBeTruthy();
}

/**
 * Assert that a response is a "success" (2xx).
 * @param {import('@playwright/test').APIResponse} res
 * @param {string} [label]
 * @param {import('@playwright/test').Expect} expect
 */
function assertSuccess(res, label, expect) {
  assertStatusClass(res, 2, label, expect);
}

/**
 * Assert that a response is a client error (4xx).
 * @param {import('@playwright/test').APIResponse} res
 * @param {string} [label]
 * @param {import('@playwright/test').Expect} expect
 */
function assertClientError(res, label, expect) {
  assertStatusClass(res, 4, label, expect);
}

/**
 * Assert that a response is a server error (5xx).
 * @param {import('@playwright/test').APIResponse} res
 * @param {string} [label]
 * @param {import('@playwright/test').Expect} expect
 */
function assertServerError(res, label, expect) {
  assertStatusClass(res, 5, label, expect);
}

/**
 * Detect the ParaBank "false-200" pattern:
 * HTTP 200 but the body contains an error message.
 *
 * ParaBank sometimes returns:
 *   HTTP 200 {"error": "..."} or {"Error": "..."} or plain text "Could not find..."
 *
 * @param {import('@playwright/test').APIResponse} res
 * @returns {Promise<{ isFalse200: boolean, errorText: string|null }>}
 */
async function detectFalse200(res) {
  if (res.status() !== 200) {
    return { isFalse200: false, errorText: null };
  }

  let bodyText = '';
  try {
    bodyText = await res.text();
  } catch {
    return { isFalse200: false, errorText: null };
  }

  const lower = bodyText.toLowerCase();
  const errorKeywords = [
    'error', 'could not find', 'invalid', 'not found',
    'exception', 'failed', 'unauthorized', 'forbidden',
  ];

  const found = errorKeywords.find((kw) => lower.includes(kw));
  if (found) {
    return { isFalse200: true, errorText: bodyText.slice(0, 300) };
  }

  return { isFalse200: false, errorText: null };
}

/**
 * Assert that a 200 response does NOT contain an error body (is a true 200).
 *
 * @param {import('@playwright/test').APIResponse} res
 * @param {string} [label]
 * @param {import('@playwright/test').Expect} expect
 */
async function assertTrueSuccess(res, label, expect) {
  assertStatus(res, 200, label, expect);
  const { isFalse200, errorText } = await detectFalse200(res);
  expect(
    isFalse200,
    `${label ? label + ' — ' : ''}HTTP 200 returned but body contains error: ${errorText}`
  ).toBeFalsy();
}

/**
 * Log the full response status line for debugging (no assertion).
 * @param {import('@playwright/test').APIResponse} res
 * @param {string} [label]
 */
function logStatus(res, label = '') {
  const code   = res.status();
  const reason = REASON_PHRASES[code] || '';
  console.log(`[Status] ${label} → HTTP ${code} ${reason}`);
}

module.exports = {
  assertStatus,
  assertStatusClass,
  assertSuccess,
  assertClientError,
  assertServerError,
  assertTrueSuccess,
  detectFalse200,
  logStatus,
  REASON_PHRASES,
};
