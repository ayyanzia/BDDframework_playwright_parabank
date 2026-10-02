// tests/api/helpers/jwt-helper.js
// ─────────────────────────────────────────────────────────────────────────────
// Lightweight JWT implementation using Node.js built-in `crypto`.
// No external npm packages required.
//
// Generates RFC 7519-compliant JWTs with HMAC-SHA256 (HS256) signatures.
// Used as a session token mechanism: one token is minted per test run in
// globalSetup, stored privately in .session.json, and propagated as
// Authorization: Bearer <token> on subsequent API requests.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const crypto = require('crypto');

const JWT_SECRET  = process.env.PARABANK_JWT_SECRET || 'parabank-qa-secret-2025';
const TOKEN_TTL_S = 3600; // 1-hour expiry

// ── Encoding helpers ─────────────────────────────────────────────────────────

/**
 * Encode a value as base64url (RFC 4648 §5).
 * @param {Buffer|string} data
 * @returns {string}
 */
function base64url(data) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(JSON.stringify(data));
  return buf.toString('base64')
    .replace(/=/g,  '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Decode a base64url string back to a JS object.
 * @param {string} str
 * @returns {object}
 */
function fromBase64url(str) {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
}

// ── JWT Core ──────────────────────────────────────────────────────────────────

/**
 * Sign a JWT with HMAC-SHA256.
 *
 * @param {{ sub: number|string, username: string, [key: string]: unknown }} payload
 * @param {string} [secret] - HMAC secret (defaults to JWT_SECRET env var)
 * @returns {{ token: string, iat: number, exp: number }}
 */
function signJwt(payload, secret = JWT_SECRET) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now    = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: now,
    exp: now + TOKEN_TTL_S,
  };

  const encodedHeader  = base64url(header);
  const encodedPayload = base64url(claims);
  const signingInput   = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64')
    .replace(/=/g,  '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return {
    token: `${signingInput}.${signature}`,
    iat:   claims.iat,
    exp:   claims.exp,
  };
}

/**
 * Verify a JWT and return the decoded payload.
 * Throws if signature is invalid or token is expired.
 *
 * @param {string} token
 * @param {string} [secret]
 * @returns {object} Decoded payload
 */
function verifyJwt(token, secret = JWT_SECRET) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('[JWT] Invalid token structure — must have 3 parts');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64')
    .replace(/=/g,  '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (expectedSig !== signature) {
    throw new Error('[JWT] Signature verification failed — token has been tampered with');
  }

  const payload = fromBase64url(encodedPayload);
  const now     = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) {
    throw new Error(`[JWT] Token expired at ${new Date(payload.exp * 1000).toISOString()}`);
  }

  return payload;
}

/**
 * Decode a JWT without verifying the signature.
 * Use only for inspection/logging — never for access control.
 *
 * @param {string} token
 * @returns {{ header: object, payload: object }}
 */
function decodeJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('[JWT] Invalid token structure');
  }
  return {
    header:  fromBase64url(parts[0]),
    payload: fromBase64url(parts[1]),
  };
}

/**
 * Check if a JWT is expired without verifying the signature.
 * @param {string} token
 * @returns {boolean}
 */
function isTokenExpired(token) {
  try {
    const { payload } = decodeJwt(token);
    const now = Math.floor(Date.now() / 1000);
    return !!(payload.exp && payload.exp < now);
  } catch {
    return true;
  }
}

/**
 * Return a human-readable summary of token claims (for test logging).
 * @param {string} token
 * @returns {string}
 */
function describeToken(token) {
  try {
    const { header, payload } = decodeJwt(token);
    const exp = payload.exp ? new Date(payload.exp * 1000).toISOString() : 'none';
    const iat = payload.iat ? new Date(payload.iat * 1000).toISOString() : 'none';
    return `[JWT] alg=${header.alg} sub=${payload.sub} username=${payload.username} iat=${iat} exp=${exp}`;
  } catch (e) {
    return `[JWT] Could not decode token: ${e.message}`;
  }
}

module.exports = {
  signJwt,
  verifyJwt,
  decodeJwt,
  isTokenExpired,
  describeToken,
  JWT_SECRET,
  TOKEN_TTL_S,
};
