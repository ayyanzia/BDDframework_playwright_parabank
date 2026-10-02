// tests/demo-multi-website.spec.js
// ─────────────────────────────────────────────────────────────────────────────
// DEMONSTRATION SPEC: Proves that this single Playwright Framework environment
// can test ANY website without creating a new framework.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { test, expect } = require('@playwright/test');
const { GenericWebPage } = require('../pages/GenericWebPage');
const { getSiteConfig } = require('../framework');

test.describe('Universal Multi-Website Testing Verification', () => {

  test('Test Website #1 (ParaBank) using Generic Framework Layer', async ({ page }) => {
    const genericPage = new GenericWebPage(page, 'parabank');
    const siteConfig  = getSiteConfig('parabank');

    // 1. Navigate to ParaBank Home
    await genericPage.navigate(siteConfig.baseUrl);
    await genericPage.expectVisible(siteConfig.login.usernameSelector);

    // 2. Perform Login using generic framework helper
    await genericPage.loginToWebsite('john', 'demo');

    // 3. Verify Login outcome
    await genericPage.expectVisible('#leftPanel');
  });

  test('Test Website #2 (SauceDemo E-Commerce) using the SAME Generic Framework Layer', async ({ page }) => {
    const genericPage = new GenericWebPage(page, 'saucedemo');
    const siteConfig  = getSiteConfig('saucedemo');

    // 1. Navigate to SauceDemo URL
    await genericPage.navigate(siteConfig.baseUrl);
    await genericPage.expectTitle(/Swag Labs|Sauce/i);

    // 2. Perform Login on SauceDemo using the SAME framework method
    await genericPage.loginToWebsite('standard_user', 'secret_sauce');

    // 3. Verify SauceDemo inventory page loaded
    await genericPage.expectVisible('.inventory_list');
  });

});
