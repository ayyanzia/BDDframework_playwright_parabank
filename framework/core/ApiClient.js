// framework/core/ApiClient.js
// ─────────────────────────────────────────────────────────────────────────────
// PROJECT-AGNOSTIC REST API client.
// Uses Node's built-in fetch (Node 18+). No external HTTP library needed.
// Wraps GET / POST / PUT / DELETE with configurable base URL and default headers.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const Logger = require('../utils/Logger');

class ApiClient {
  /**
   * @param {string} [baseUrl=''] - Optional base URL prepended to every request.
   * @param {Record<string,string>} [defaultHeaders={}]
   */
  constructor(baseUrl = '', defaultHeaders = {}) {
    this._baseUrl = baseUrl.replace(/\/$/, ''); // strip trailing slash
    this._defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...defaultHeaders,
    };
  }

  // ── Configuration ────────────────────────────────────────────────────────────

  /**
   * Set or override the base URL at runtime.
   * @param {string} url
   */
  setBaseUrl(url) {
    this._baseUrl = url.replace(/\/$/, '');
  }

  /**
   * Merge additional default headers.
   * @param {Record<string,string>} headers
   */
  setDefaultHeaders(headers) {
    this._defaultHeaders = { ...this._defaultHeaders, ...headers };
  }

  // ── Core request ─────────────────────────────────────────────────────────────

  /**
   * Internal request helper.
   * @param {string} method
   * @param {string} path
   * @param {{ body?: any, headers?: Record<string,string>, timeout?: number }} [options]
   * @returns {Promise<{ status: number, headers: Headers, body: any }>}
   */
  async _request(method, path, options = {}) {
    const url = path.startsWith('http') ? path : `${this._baseUrl}${path}`;
    const headers = { ...this._defaultHeaders, ...(options.headers ?? {}) };
    const init = {
      method,
      headers,
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    };

    Logger.info(`[ApiClient] ${method} ${url}`);

    const response = await fetch(url, init);
    let body;
    try {
      const contentType = response.headers.get('content-type') ?? '';
      body = contentType.includes('application/json')
        ? await response.json()
        : await response.text();
    } catch {
      body = null;
    }

    Logger.debug(`[ApiClient] Response ${response.status} ← ${url}`);

    return {
      status: response.status,
      headers: response.headers,
      body,
      ok: response.ok,
    };
  }

  // ── Public HTTP methods ──────────────────────────────────────────────────────

  /**
   * HTTP GET
   * @param {string} path
   * @param {Record<string,string>} [headers]
   */
  async get(path, headers = {}) {
    return this._request('GET', path, { headers });
  }

  /**
   * HTTP POST
   * @param {string} path
   * @param {any} body
   * @param {Record<string,string>} [headers]
   */
  async post(path, body, headers = {}) {
    return this._request('POST', path, { body, headers });
  }

  /**
   * HTTP PUT
   * @param {string} path
   * @param {any} body
   * @param {Record<string,string>} [headers]
   */
  async put(path, body, headers = {}) {
    return this._request('PUT', path, { body, headers });
  }

  /**
   * HTTP DELETE
   * @param {string} path
   * @param {Record<string,string>} [headers]
   */
  async delete(path, headers = {}) {
    return this._request('DELETE', path, { headers });
  }

  /**
   * HTTP PATCH
   * @param {string} path
   * @param {any} body
   * @param {Record<string,string>} [headers]
   */
  async patch(path, body, headers = {}) {
    return this._request('PATCH', path, { body, headers });
  }
}

module.exports = { ApiClient };
