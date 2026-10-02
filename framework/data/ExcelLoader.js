// framework/data/ExcelLoader.js
// ─────────────────────────────────────────────────────────────────────────────
// PROJECT-AGNOSTIC Excel (.xlsx / .xls) data loader.
// Uses the 'xlsx' package (already in devDependencies).
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const path   = require('path');
const Logger = require('../utils/Logger');

const ExcelLoader = {
  /**
   * Load an Excel file and return all rows from a sheet as an array of objects.
   * The first row is treated as column headers.
   *
   * @param {string} filePath - Absolute or relative path to the .xlsx file.
   * @param {string} [sheetName] - Sheet name; defaults to the first sheet.
   * @returns {Record<string, any>[]} Array of row objects keyed by header names.
   */
  load(filePath, sheetName) {
    // Lazy-require so environments without xlsx installed still boot fine.
    let XLSX;
    try {
      XLSX = require('xlsx');
    } catch {
      throw new Error('[ExcelLoader] Package "xlsx" is not installed. Run: npm install xlsx');
    }

    const resolved = path.resolve(filePath);
    Logger.debug(`[ExcelLoader] Loading → ${resolved} (sheet: ${sheetName ?? 'first'})`);

    const workbook = XLSX.readFile(resolved);
    const sheet    = sheetName ? workbook.Sheets[sheetName] : workbook.Sheets[workbook.SheetNames[0]];

    if (!sheet) {
      throw new Error(`[ExcelLoader] Sheet "${sheetName}" not found in ${resolved}`);
    }

    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
  },

  /**
   * Load a specific column from an Excel sheet as a flat array of values.
   * @param {string} filePath
   * @param {string} colName - Header name of the column to extract.
   * @param {string} [sheetName]
   * @returns {any[]}
   */
  loadColumn(filePath, colName, sheetName) {
    const rows = ExcelLoader.load(filePath, sheetName);
    return rows.map((row) => row[colName]);
  },

  /**
   * List all sheet names in an Excel file.
   * @param {string} filePath
   * @returns {string[]}
   */
  listSheets(filePath) {
    const XLSX    = require('xlsx');
    const resolved = path.resolve(filePath);
    const workbook = XLSX.readFile(resolved);
    return workbook.SheetNames;
  },
};

module.exports = ExcelLoader;
