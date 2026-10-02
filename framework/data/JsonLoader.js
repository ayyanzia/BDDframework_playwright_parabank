// framework/data/JsonLoader.js
// ─────────────────────────────────────────────────────────────────────────────
// PROJECT-AGNOSTIC JSON fixture loader.
// Reads and writes JSON files from disk. Useful for static test data fixtures.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const path = require('path');
const Logger = require('../utils/Logger');

const JsonLoader = {
  /**
   * Load and parse a JSON file.
   * @param {string} filePath - Absolute or relative path to the .json file.
   * @returns {any} The parsed JSON value (object, array, etc.).
   */
  load(filePath) {
    const resolved = path.resolve(filePath);
    Logger.debug(`[JsonLoader] Loading → ${resolved}`);
    if (!fs.existsSync(resolved)) {
      throw new Error(`[JsonLoader] File not found: ${resolved}`);
    }
    const raw = fs.readFileSync(resolved, 'utf-8');
    try {
      return JSON.parse(raw);
    } catch (err) {
      throw new Error(`[JsonLoader] Failed to parse JSON at ${resolved}: ${err.message}`);
    }
  },

  /**
   * Write data as a JSON file (pretty-printed).
   * Creates parent directories if they do not exist.
   * @param {string} filePath - Destination path.
   * @param {any} data - Data to serialise.
   * @param {number} [indent=2]
   */
  save(filePath, data, indent = 2) {
    const resolved = path.resolve(filePath);
    Logger.debug(`[JsonLoader] Saving → ${resolved}`);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, JSON.stringify(data, null, indent), 'utf-8');
  },

  /**
   * Read a JSON file and return a specific top-level key.
   * @param {string} filePath
   * @param {string} key
   * @returns {any}
   */
  get(filePath, key) {
    const data = JsonLoader.load(filePath);
    if (!(key in data)) {
      throw new Error(`[JsonLoader] Key "${key}" not found in ${filePath}`);
    }
    return data[key];
  },
};

module.exports = JsonLoader;
