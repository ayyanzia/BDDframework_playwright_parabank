// framework/data/DataFactory.js
// ─────────────────────────────────────────────────────────────────────────────
// PROJECT-AGNOSTIC data factory — single entry-point for all test data loading.
// Auto-detects file extension and delegates to the appropriate loader.
// Test files only need to import DataFactory, never individual loaders.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const path        = require('path');
const JsonLoader  = require('./JsonLoader');
const ExcelLoader = require('./ExcelLoader');
const CsvLoader   = require('./CsvLoader');
const Logger      = require('../utils/Logger');

const DataFactory = {
  /**
   * Load data from a file, auto-detecting format by extension.
   * Supported: .json, .xlsx, .xls, .csv
   *
   * @param {string} filePath - Absolute or relative path to the data file.
   * @param {{ sheetName?: string, delimiter?: string }} [options]
   * @returns {any}
   *
   * @example
   * const users = DataFactory.fromFile('data/fixtures/users.json');
   * const rows  = DataFactory.fromFile('data/fixtures/users.xlsx', { sheetName: 'Sheet1' });
   * const csv   = DataFactory.fromFile('data/fixtures/users.csv');
   */
  fromFile(filePath, options = {}) {
    const ext = path.extname(filePath).toLowerCase();
    Logger.info(`[DataFactory] Loading "${filePath}" (detected format: ${ext || 'unknown'})`);

    switch (ext) {
      case '.json':
        return JsonLoader.load(filePath);

      case '.xlsx':
      case '.xls':
        return ExcelLoader.load(filePath, options.sheetName);

      case '.csv':
        return CsvLoader.load(filePath, options.delimiter);

      default:
        throw new Error(
          `[DataFactory] Unsupported file format "${ext}" for file: ${filePath}.\n` +
          'Supported formats: .json, .xlsx, .xls, .csv'
        );
    }
  },

  /**
   * Load a specific column from a tabular data file (Excel or CSV).
   * @param {string} filePath
   * @param {string} colName
   * @param {{ sheetName?: string, delimiter?: string }} [options]
   * @returns {any[]}
   */
  columnFromFile(filePath, colName, options = {}) {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.xlsx':
      case '.xls':
        return ExcelLoader.loadColumn(filePath, colName, options.sheetName);

      case '.csv':
        return CsvLoader.loadColumn(filePath, colName, options.delimiter);

      case '.json': {
        const data = JsonLoader.load(filePath);
        if (!Array.isArray(data)) {
          throw new Error(`[DataFactory] columnFromFile: JSON file must contain an array: ${filePath}`);
        }
        return data.map((row) => row[colName]);
      }

      default:
        throw new Error(`[DataFactory] Unsupported format for columnFromFile: ${ext}`);
    }
  },

  // ── Direct loader access (for advanced use cases) ────────────────────────────

  /** Access the JsonLoader directly. */
  json: JsonLoader,

  /** Access the ExcelLoader directly. */
  excel: ExcelLoader,

  /** Access the CsvLoader directly. */
  csv: CsvLoader,
};

module.exports = DataFactory;
