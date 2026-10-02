// framework/utils/Logger.js
// ─────────────────────────────────────────────────────────────────────────────
// PROJECT-AGNOSTIC structured console logger.
// Respects the LOG_LEVEL environment variable.
// Levels (ascending verbosity): error < warn < info < debug
// Default level: info
// Set LOG_LEVEL=debug for verbose Playwright step traces.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const COLOURS = {
  reset:  '\x1b[0m',
  grey:   '\x1b[90m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
};

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 23);
}

function currentLevel() {
  const env = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
  return LEVELS[env] ?? LEVELS.info;
}

function log(level, colour, msg) {
  if (LEVELS[level] <= currentLevel()) {
    const prefix = `${COLOURS.grey}[${timestamp()}]${COLOURS.reset} ${colour}[${level.toUpperCase()}]${COLOURS.reset}`;
    console.log(`${prefix} ${msg}`);
  }
}

const Logger = {
  /** @param {string} msg */
  info:  (msg) => log('info',  COLOURS.cyan,   msg),

  /** @param {string} msg */
  warn:  (msg) => log('warn',  COLOURS.yellow, msg),

  /** @param {string} msg */
  error: (msg) => log('error', COLOURS.red,    msg),

  /**
   * Debug messages — only shown when LOG_LEVEL=debug.
   * @param {string} msg
   */
  debug: (msg) => log('debug', COLOURS.grey,   msg),
};

module.exports = Logger;
