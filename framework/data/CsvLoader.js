// framework/data/CsvLoader.js
// ─────────────────────────────────────────────────────────────────────────────
// PROJECT-AGNOSTIC CSV data loader.
// Zero external dependencies — pure Node.js fs + string parsing.
// Supports quoted fields, commas inside quotes, and CRLF / LF line endings.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const path = require('path');
const Logger = require('../utils/Logger');

/**
 * Parse a single CSV line, respecting quoted fields.
 * @param {string} line
 * @param {string} [delimiter=',']
 * @returns {string[]}
 */
function parseLine(line, delimiter = ',') {
  const fields = [];
  let current  = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch   = line[i];
    const next = line[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

const CsvLoader = {
  /**
   * Load a CSV file and return all rows as an array of objects.
   * The first row is treated as column headers.
   *
   * @param {string} filePath - Absolute or relative path to the .csv file.
   * @param {string} [delimiter=','] - Column delimiter character.
   * @returns {Record<string, string>[]}
   */
  load(filePath, delimiter = ',') {
    const resolved = path.resolve(filePath);
    Logger.debug(`[CsvLoader] Loading → ${resolved}`);

    if (!fs.existsSync(resolved)) {
      throw new Error(`[CsvLoader] File not found: ${resolved}`);
    }

    const raw   = fs.readFileSync(resolved, 'utf-8');
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length < 2) {
      Logger.warn(`[CsvLoader] File has no data rows: ${resolved}`);
      return [];
    }

    const headers = parseLine(lines[0], delimiter);
    const rows    = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i], delimiter);
      const row    = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] ?? '';
      });
      rows.push(row);
    }

    Logger.debug(`[CsvLoader] Loaded ${rows.length} rows from ${resolved}`);
    return rows;
  },

  /**
   * Extract a single column as a flat array of values.
   * @param {string} filePath
   * @param {string} colName
   * @param {string} [delimiter=',']
   * @returns {string[]}
   */
  loadColumn(filePath, colName, delimiter = ',') {
    const rows = CsvLoader.load(filePath, delimiter);
    return rows.map((r) => r[colName] ?? '');
  },
};

module.exports = CsvLoader;
