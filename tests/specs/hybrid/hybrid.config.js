// tests/specs/hybrid/hybrid.config.js
// Config for Hybrid UI & API Cross Validation Suite

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './',
  testMatch: ['**/*.spec.js'],
  timeout: 60 * 1000,
  expect: { timeout: 20 * 1000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: '../../../test-results/hybrid-artifacts',
  reporter: [
    ['list'],
    ['html', { outputFolder: '../../../test-results/hybrid-html-report', open: 'never' }],
  ],
  use: {
    baseURL: 'https://parabank.parasoft.com/parabank/',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 20 * 1000,
    navigationTimeout: 20 * 1000,
  },
});
