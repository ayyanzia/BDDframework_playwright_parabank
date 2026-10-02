// framework/core/BrowserManager.js
// ─────────────────────────────────────────────────────────────────────────────
// PROJECT-AGNOSTIC centralised browser lifecycle manager.
// Replaces scattered chromium.launch() / browser.newContext() calls.
// Holds a single shared browser, context, and page for the whole test run.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { chromium } = require('@playwright/test');
const Logger = require('../utils/Logger');

/** Singleton state — one browser, context, and page shared for the entire suite run. */
let _browser = null;
let _context = null;
let _page    = null;

const BrowserManager = {
  // ── Lifecycle ───────────────────────────────────────────────────────────────

  /**
   * Launch a Chromium browser.
   * @param {{ headless?: boolean, slowMo?: number }} [options]
   * @returns {Promise<import('@playwright/test').Browser>}
   */
  async launch(options = {}) {
    const headless = options.headless ?? (process.env.HEADLESS !== 'false');
    Logger.info(`[BrowserManager] Launching Chromium (headless: ${headless})`);
    _browser = await chromium.launch({ headless, slowMo: options.slowMo ?? 0 });
    return _browser;
  },

  /**
   * Create a new browser context (isolated cookies / storage).
   * @param {{ baseURL?: string, [key: string]: any }} [options]
   * @returns {Promise<import('@playwright/test').BrowserContext>}
   */
  async newContext(options = {}) {
    if (!_browser) throw new Error('[BrowserManager] Call launch() before newContext()');
    Logger.info(`[BrowserManager] Creating browser context (baseURL: ${options.baseURL ?? 'not set'})`);
    _context = await _browser.newContext(options);
    return _context;
  },

  /**
   * Open a new page inside the current context.
   * @returns {Promise<import('@playwright/test').Page>}
   */
  async newPage() {
    if (!_context) throw new Error('[BrowserManager] Call newContext() before newPage()');
    Logger.info('[BrowserManager] Opening new page');
    _page = await _context.newPage();
    return _page;
  },

  // ── Accessors ───────────────────────────────────────────────────────────────

  /** @returns {import('@playwright/test').Browser|null} */
  getBrowser: () => _browser,

  /** @returns {import('@playwright/test').BrowserContext|null} */
  getContext: () => _context,

  /** @returns {import('@playwright/test').Page|null} */
  getPage: () => _page,

  /** @param {import('@playwright/test').Browser} b */
  setBrowser: (b) => { _browser = b; },

  /** @param {import('@playwright/test').BrowserContext} c */
  setContext: (c) => { _context = c; },

  /** @param {import('@playwright/test').Page} p */
  setPage: (p) => { _page = p; },

  // ── Teardown ────────────────────────────────────────────────────────────────

  /** Close the current page. */
  async closePage() {
    if (_page) {
      Logger.info('[BrowserManager] Closing page');
      await _page.close();
      _page = null;
    }
  },

  /** Close the current browser context. */
  async closeContext() {
    if (_context) {
      Logger.info('[BrowserManager] Closing context');
      await _context.close();
      _context = null;
    }
  },

  /** Close the browser (tears down everything). */
  async closeBrowser() {
    if (_browser) {
      Logger.info('[BrowserManager] Closing browser');
      await _browser.close();
      _browser = null;
    }
  },

  /** Full teardown in correct order: page → context → browser. */
  async teardown() {
    await BrowserManager.closePage();
    await BrowserManager.closeContext();
    await BrowserManager.closeBrowser();
  },

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Create a temporary isolated context + page (useful for session / auth tests).
   * Caller is responsible for closing both returned objects.
   * @param {{ baseURL?: string }} [options]
   * @returns {Promise<{ context: import('@playwright/test').BrowserContext, page: import('@playwright/test').Page }>}
   */
  async newIsolatedPage(options = {}) {
    if (!_browser) throw new Error('[BrowserManager] Call launch() before newIsolatedPage()');
    const context = await _browser.newContext(options);
    const page    = await context.newPage();
    return { context, page };
  },
};

module.exports = BrowserManager;
