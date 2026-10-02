// framework/index.js
// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API — single barrel export for the entire Framework Layer.
// The test layer (pages/, features/, tests/) imports from here ONLY.
//
// Usage in test layer:
//   const { BaseActions, BrowserManager, DataFactory, FakerHelper, Assertions } =
//         require('../framework');
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { BaseActions } = require('./core/BaseActions');
const BrowserManager  = require('./core/BrowserManager');
const { ApiClient }   = require('./core/ApiClient');
const DataFactory     = require('./data/DataFactory');
const JsonLoader      = require('./data/JsonLoader');
const ExcelLoader     = require('./data/ExcelLoader');
const CsvLoader       = require('./data/CsvLoader');
const FakerHelper     = require('./utils/FakerHelper');
const Logger          = require('./utils/Logger');
const Assertions      = require('./utils/Assertions');
const TagFilter       = require('./utils/TagFilter');

const { getSiteConfig, sites } = require('./config/siteConfig');

module.exports = {
  // Core
  BaseActions,
  BrowserManager,
  ApiClient,
  getSiteConfig,
  sites,

  // Data
  DataFactory,
  JsonLoader,
  ExcelLoader,
  CsvLoader,

  // Utils
  FakerHelper,
  Logger,
  Assertions,
  TagFilter,
};
