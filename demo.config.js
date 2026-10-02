// demo.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: ['**/demo-multi-website.spec.js'],
  timeout: 60 * 1000,
  use: {
    headless: true,
    actionTimeout: 20 * 1000,
    navigationTimeout: 20 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
