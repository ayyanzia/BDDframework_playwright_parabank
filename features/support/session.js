// features/support/session.js
// ─────────────────────────────────────────────────────────────────────────────
// ParaBank test session state singleton.
// Delegates browser lifecycle to BrowserManager from the framework layer.
// Keeps the same public API so hooks.js and steps.js need no import changes.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const BrowserManager = require('../../framework/core/BrowserManager');

/** ParaBank-specific session state — the registered primary user for this run. */
let _primaryUser = null;

module.exports = {
  // ── Browser lifecycle — delegates to BrowserManager ────────────────────────
  getBrowser:  () => BrowserManager.getBrowser(),
  setBrowser:  (b) => BrowserManager.setBrowser(b),
  getContext:  () => BrowserManager.getContext(),
  setContext:  (c) => BrowserManager.setContext(c),
  getPage:     () => BrowserManager.getPage(),
  setPage:     (p) => BrowserManager.setPage(p),

  // ── ParaBank-specific: primary test user ────────────────────────────────────
  getPrimaryUser: () => _primaryUser,
  setPrimaryUser: (u) => { _primaryUser = u; },
};
