// framework/config/siteConfig.js
// ─────────────────────────────────────────────────────────────────────────────
// PROJECT-AGNOSTIC Site Registry & Selector Configuration.
// Allows testing ANY target website in this framework without creating a new codebase.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const sites = {
  // 1. ParaBank Default Site Config
  parabank: {
    name: 'ParaBank Financial',
    baseUrl: process.env.PARABANK_URL || 'https://parabank.parasoft.com/parabank/',
    login: {
      url: 'index.htm',
      usernameSelector: 'input[name="username"]',
      passwordSelector: 'input[name="password"]',
      submitSelector: 'input[value="Log In"]',
    },
    registration: {
      url: 'register.htm',
      formSelectors: {
        firstName: 'input[id="customer.firstName"]',
        lastName: 'input[id="customer.lastName"]',
        street: 'input[id="customer.address.street"]',
        city: 'input[id="customer.address.city"]',
        state: 'input[id="customer.address.state"]',
        zipCode: 'input[id="customer.address.zipCode"]',
        phone: 'input[id="customer.phoneNumber"]',
        ssn: 'input[id="customer.ssn"]',
        username: 'input[id="customer.username"]',
        password: 'input[id="customer.password"]',
        confirmPassword: 'input[id="repeatedPassword"]',
      },
      submitSelector: 'input[value="Register"]',
    },
  },

  // 2. Example: SauceDemo E-Commerce Site Config
  saucedemo: {
    name: 'SauceDemo E-Commerce',
    baseUrl: 'https://www.saucedemo.com/',
    login: {
      url: '',
      usernameSelector: '#user-name',
      passwordSelector: '#password',
      submitSelector: '#login-button',
    },
  },

  // 3. Example: Custom Enterprise Portal Config (Template for ANY Website)
  customSite: {
    name: 'Custom Target Portal',
    baseUrl: process.env.TARGET_SITE_URL || 'https://example.com/',
    login: {
      url: 'login',
      usernameSelector: 'input[type="email"], #username',
      passwordSelector: 'input[type="password"], #password',
      submitSelector: 'button[type="submit"], #login-btn',
    },
  },
};

/**
 * Get site configuration by key. Defaults to 'parabank' if unspecified.
 * @param {string} [siteKey]
 */
function getSiteConfig(siteKey = process.env.TARGET_SITE || 'parabank') {
  const config = sites[siteKey.toLowerCase()];
  if (!config) {
    throw new Error(`[SiteConfig] Unknown site key: "${siteKey}". Available sites: ${Object.keys(sites).join(', ')}`);
  }
  return config;
}

module.exports = {
  sites,
  getSiteConfig,
};
