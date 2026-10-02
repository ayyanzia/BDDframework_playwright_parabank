// tests/helpers/status-evaluator.js
// ─────────────────────────────────────────────────────────────────────────────
// Status Evaluator Module
//
// 100% Async Architecture with Switch Statement Status Code Evaluator
// Categorizes and validates HTTP response status codes across API and UI network
// interactions (200, 201, 302, 400, 401, 403, 404, 429, 500).
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const STATUS_TYPES = {
  PASS_OK:           'PASS_OK',
  PASS_CREATED:      'PASS_CREATED',
  PASS_REDIRECT:     'PASS_REDIRECT',
  FAIL_BAD_REQUEST:  'FAIL_BAD_REQUEST',
  FAIL_UNAUTHORIZED: 'FAIL_UNAUTHORIZED',
  FAIL_FORBIDDEN:    'FAIL_FORBIDDEN',
  FAIL_NOT_FOUND:    'FAIL_NOT_FOUND',
  WARN_RATE_LIMITED: 'WARN_RATE_LIMITED',
  FAIL_SERVER_ERROR: 'FAIL_SERVER_ERROR',
  UNKNOWN_STATUS:    'UNKNOWN_STATUS'
};

/**
 * Async Evaluator using a switch statement to process and categorize HTTP response codes.
 *
 * @param {import('@playwright/test').APIResponse | { status: () => number, text: () => Promise<string> }} response
 * @param {object} options
 * @returns {Promise<{ statusCode: number, category: string, isSuccess: boolean, bodyText: string }>}
 */
async function evaluateStatusCode(response, options = {}) {
  const { label = '', allowFalse200 = false } = options;
  const statusCode = typeof response.status === 'function' ? response.status() : 200;
  let bodyText = '';

  try {
    if (typeof response.text === 'function') {
      bodyText = await response.text();
    }
  } catch (err) {
    bodyText = '';
  }

  let category = STATUS_TYPES.UNKNOWN_STATUS;
  let isSuccess = false;

  // Switch statement handling for all HTTP response status codes
  switch (statusCode) {
    case 200:
      category = STATUS_TYPES.PASS_OK;
      // Inspect for ParaBank "False-200" legacy error payloads
      if (!allowFalse200 && bodyText) {
        const lower = bodyText.toLowerCase();
        if (lower.includes('error') || lower.includes('could not find') || lower.includes('invalid')) {
          console.warn(`[StatusEvaluator] Warning: HTTP 200 returned but response contains error payload: ${bodyText.slice(0, 100)}`);
        }
      }
      isSuccess = true;
      break;

    case 201:
      category = STATUS_TYPES.PASS_CREATED;
      isSuccess = true;
      break;

    case 301:
    case 302:
      category = STATUS_TYPES.PASS_REDIRECT;
      isSuccess = true;
      break;

    case 400:
      category = STATUS_TYPES.FAIL_BAD_REQUEST;
      isSuccess = false;
      break;

    case 401:
      category = STATUS_TYPES.FAIL_UNAUTHORIZED;
      isSuccess = false;
      break;

    case 403:
      category = STATUS_TYPES.FAIL_FORBIDDEN;
      isSuccess = false;
      break;

    case 404:
      category = STATUS_TYPES.FAIL_NOT_FOUND;
      isSuccess = false;
      break;

    case 429:
      category = STATUS_TYPES.WARN_RATE_LIMITED;
      isSuccess = false;
      console.warn(`[StatusEvaluator] Rate-limit (HTTP 429) detected for ${label}. Rate backoff active.`);
      break;

    case 500:
    case 502:
    case 503:
    case 504:
      category = STATUS_TYPES.FAIL_SERVER_ERROR;
      isSuccess = false;
      break;

    default:
      if (statusCode >= 200 && statusCode < 300) {
        category = STATUS_TYPES.PASS_OK;
        isSuccess = true;
      } else {
        category = STATUS_TYPES.UNKNOWN_STATUS;
        isSuccess = false;
      }
      break;
  }

  console.log(`[StatusEvaluator] ${label || 'Response'} -> HTTP ${statusCode} [${category}]`);

  return {
    statusCode,
    category,
    isSuccess,
    bodyText
  };
}

/**
 * Async assertion helper utilizing switch statement classification.
 *
 * @param {import('@playwright/test').APIResponse} response
 * @param {number} expectedCode
 * @param {string} label
 * @param {Function} expectFn
 */
async function assertStatusWithSwitch(response, expectedCode, label, expectFn) {
  const result = await evaluateStatusCode(response, { label });
  
  if (result.statusCode === 429) {
    console.warn(`[StatusEvaluator] ${label} - Skipping hard assertion due to rate limiting (429)`);
    return;
  }

  switch (expectedCode) {
    case 200:
    case 201:
      expectFn(result.isSuccess, `${label} - Expected success status (200/201), got HTTP ${result.statusCode}`).toBeTruthy();
      break;
    case 400:
      expectFn(result.category === STATUS_TYPES.FAIL_BAD_REQUEST || result.statusCode === 400, `${label} - Expected HTTP 400, got ${result.statusCode}`).toBeTruthy();
      break;
    case 404:
      expectFn(result.category === STATUS_TYPES.FAIL_NOT_FOUND || result.statusCode === 404, `${label} - Expected HTTP 404, got ${result.statusCode}`).toBeTruthy();
      break;
    default:
      expectFn(result.statusCode, `${label} - Expected HTTP ${expectedCode}, got ${result.statusCode}`).toBe(expectedCode);
      break;
  }
}

module.exports = {
  STATUS_TYPES,
  evaluateStatusCode,
  assertStatusWithSwitch
};
