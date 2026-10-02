# ParaBank QA Automation Framework — BDD & Two-Layer Architecture

> **Enterprise-grade Behavior-Driven Development (BDD) test automation framework for the [ParaBank](https://parabank.parasoft.com/parabank/) online banking platform.**  
> Features 13 Gherkin feature files, 93 automated BDD scenarios, Page Object Model (POM) architecture, a decoupled project-agnostic core engine, shared browser session lifecycle, and an interactive executive HTML execution dashboard.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Task & Deliverables Verification](#task--deliverables-verification)
3. [Architecture Overview](#architecture-overview)
4. [Complete Directory Structure](#complete-directory-structure)
5. [BDD Feature & Scenario Coverage](#bdd-feature--scenario-coverage)
6. [HTML Execution Reports & Test Analysis](#html-execution-reports--test-analysis)
7. [Getting Started & Installation](#getting-started--installation)
8. [Test Execution Guide](#test-execution-guide)
   - [Running BDD Cucumber Tests](#1-running-bdd-cucumber-tests)
   - [Running by Test Tier (Smoke / Sanity / Regression)](#2-running-by-test-tier)
   - [Running by Feature Module](#3-running-by-feature-module)
   - [Running REST API & Hybrid Test Suites](#4-running-rest-api--hybrid-test-suites)
   - [Generating Reports](#5-generating-reports)
9. [Configuration & Environment Variables](#configuration--environment-variables)
10. [CI/CD Pipeline](#cicd-pipeline)
11. [Framework Extensibility Guide](#framework-extensibility-guide)

---

## Project Overview

This repository contains a production-ready, full-stack test automation framework engineered for Parasoft's **ParaBank** online banking application. It combines the human-readable clarity of **Behavior-Driven Development (Cucumber Gherkin)** with the speed and reliability of **Playwright**.

### Core Highlights:
- **Clean Two-Layer Separation**: An engine layer (`framework/`) that has zero application dependencies, coupled with a banking domain test layer (`features/`, `pages/`, `tests/`).
- **Human-Readable Living Documentation**: 13 feature files covering critical banking operations (transfers, bill payments, account creation, loan requests, security, and session management).
- **Page Object Model (POM)**: Strongly typed, selector-isolated page representations extending standard base actions.
- **Enterprise Reporting**: Standalone, interactive HTML dashboards displaying KPI statistics, step-by-step logs, collapsible module cards, and failure analysis.
- **High Reliability**: Engineered for live demo environments with session reuse, dynamic fake data generation, and built-in rate-limit resilience.

---

## Task & Deliverables Verification

This repository fulfills the BDD automation milestone and contains all required artifacts:

| Deliverable | Status | Location & Details |
|---|:---:|---|
| **BDD Feature Files** | **Complete** | `features/*.feature` — 13 feature files covering 13 functional domains |
| **Behavior-Based Scenarios** | **Complete** | 93 executable Gherkin scenarios with positive, negative, and edge cases |
| **Step Definitions** | **Complete** | `features/step_definitions/steps.js` (748 lines) backed by `features/support/` |
| **Automated Tests** | **Complete** | Configured via `@cucumber/cucumber` and `@playwright/test` with 25+ npm scripts |
| **HTML Execution Report** | **Complete** | Interactive dashboard (`QA_REPORT.html`) + Cucumber HTML report + report generator scripts |

---

## Architecture Overview

The framework employs a **Two-Layer Architecture** designed for high reusability, maintainability, and clean separation of concerns:

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                      LAYER 1: FRAMEWORK ENGINE (Agnostic)                          │
│                     Located at: /framework (Zero ParaBank refs)                   │
├──────────────────────────────────────┬────────────────────────────────────────────┤
│  Core Primitives                     │  Data & Utilities                          │
│  • BaseActions (Clicks, inputs, waits│  • DataFactory (JSON/Excel/CSV auto-detect)│
│  • BrowserManager (Shared lifecycle) │  • FakerHelper (Random personas & data)    │
│  • ApiClient (Native REST client)    │  • Logger (Structured ANSI colour logs)    │
│                                      │  • Assertions (Rich descriptive failures)  │
│                                      │  • TagFilter (Cucumber taxonomy mappings)  │
└──────────────────────────────────────┴────────────────────────────────────────────┘
                                          │
                        imported by       │ (POM & Step Definitions)
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                      LAYER 2: PARABANK TEST IMPLEMENTATION                         │
│               Located at: /features, /pages, /tests, /reporting                   │
├───────────────────────────────────────────────────────────────────────────────────┤
│  • Page Objects (/pages): BasePage, LoginPage, RegistrationPage, BillPayPage...    │
│  • BDD Feature Files (/features): 13 Gherkin specifications, 93 scenarios         │
│  • Step Definitions (/features/step_definitions): Maps Gherkin to Page Objects    │
│  • Support & World (/features/support): Shared browser context, session setup     │
│  • Reporting (/reporting): JSON-to-HTML enterprise reporting dashboard generator  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Directory Structure

```plaintext
parabank-playwright-automation/
├── .github/
│   └── workflows/
│       └── playwright.yml             # GitHub Actions CI workflow configuration
├── data/
│   ├── fixtures/
│   │   └── users.json                 # Static test fixtures and baseline users
│   └── data-generators.js             # Banking-domain fake data generators
├── features/                          # Behavior-Driven Development (BDD) Layer
│   ├── accounts_overview.feature      # Accounts balance and activity scenarios
│   ├── bill_pay.feature               # Payee management and bill payment flows
│   ├── find_transactions.feature      # Transaction search (by ID, date, amount)
│   ├── login.feature                  # Authentication & logout test scenarios
│   ├── navigation.feature             # Header, footer, and menu link verification
│   ├── open_account.feature           # Checking & savings account creation
│   ├── registration.feature           # Customer onboarding and input validation
│   ├── request_loan.feature           # Loan application and threshold tests
│   ├── security.feature               # SQL injection, XSS, and unauth access tests
│   ├── session_management.feature     # Cookie persistence and timeout checks
│   ├── transfer_funds.feature         # Inter-account money transfer scenarios
│   ├── ui_usability.feature           # Responsive design, accessibility, UI states
│   ├── update_contact.feature         # Profile update and persistence scenarios
│   ├── step_definitions/
│   │   └── steps.js                   # Cucumber step definitions (748 lines)
│   └── support/
│       ├── hooks.js                   # Before/After lifecycle and browser hooks
│       ├── session.js                 # Shared authenticated session singleton
│       └── world.js                   # Custom Cucumber World constructor
├── framework/                         # Project-Agnostic Core Automation Engine
│   ├── index.js                       # Barrel export for Layer 1 API
│   ├── core/
│   │   ├── ApiClient.js               # REST client using native fetch (Node 18+)
│   │   ├── BaseActions.js             # Safe element interactions & locator wrappers
│   │   └── BrowserManager.js          # Shared Chromium instance manager
│   ├── data/
│   │   ├── CsvLoader.js               # Generic CSV parsing engine
│   │   ├── DataFactory.js             # Unified file-based data ingestion hub
│   │   ├── ExcelLoader.js             # SheetJS (.xlsx/.xls) workbook reader
│   │   └── JsonLoader.js              # Strict JSON data loader
│   └── utils/
│       ├── Assertions.js              # Custom assertions with descriptive errors
│       ├── FakerHelper.js             # Dynamic data generator (names, SSN, etc.)
│       ├── Logger.js                  # ANSI colour-coded log formatter
│       └── TagFilter.js               # Cucumber tag parsing and script generator
├── pages/                             # Page Object Model (POM) Implementations
│   ├── AccountsOverviewPage.js        # Account grid, balances, transaction links
│   ├── BasePage.js                    # Shared ParaBank header/footer/menu locators
│   ├── BillPayPage.js                 # Payee form inputs and validation messages
│   ├── FindTransactionsPage.js        # Date, amount, and ID search inputs
│   ├── GenericWebPage.js              # Fallback web page wrapper
│   ├── LoginPage.js                   # Login inputs, submit button, error banners
│   ├── OpenAccountPage.js             # Account type dropdowns and submission
│   ├── ParaBankPages.js               # Page object aggregator / factory
│   ├── RegistrationPage.js            # Registration fields and validation alerts
│   ├── RequestLoanPage.js             # Loan amount, down payment, and status card
│   ├── TransferFundsPage.js           # Account pickers, transfer inputs, confirmations
│   └── UpdateContactPage.js           # Customer contact update form
├── reporting/                         # Custom Reporting Infrastructure
│   ├── generate-html-report-cucumber.js # Builds QA_REPORT.html from Cucumber JSON
│   ├── generate-html-report.js        # Builds HTML report for Playwright specs
│   ├── generate-report-cucumber.js    # Markdown summary generator for BDD
│   └── generate-report.js             # Markdown summary generator for Playwright
├── tests/                             # Playwright Native Specs & API Suites
│   ├── accounts-overview.spec.js      # Native Playwright account tests
│   ├── bill-pay.spec.js               # Native Playwright bill pay tests
│   ├── find-transactions.spec.js      # Native Playwright transaction tests
│   ├── login.spec.js                  # Native Playwright login tests
│   ├── navigation.spec.js             # Native Playwright navigation tests
│   ├── open_account.spec.js           # Native Playwright open account tests
│   ├── registration.spec.js           # Native Playwright registration tests
│   ├── request-loan.spec.js           # Native Playwright loan tests
│   ├── security.spec.js               # Native Playwright security tests
│   ├── session.spec.js                # Native Playwright session tests
│   ├── transfer-funds.spec.js         # Native Playwright fund transfer tests
│   ├── ui-usability.spec.js           # Native Playwright UI usability tests
│   ├── update-contact.spec.js         # Native Playwright update contact tests
│   ├── api/                           # Pure REST API Automation Suite (126 Tests)
│   │   ├── api.config.js              # Dedicated API test configuration
│   │   ├── global-setup.js            # Pre-test customer registration and setup
│   │   └── specs/                     # REST endpoint specs (auth, accounts, loans...)
│   └── specs/hybrid/                  # Hybrid UI + API Validation Specs
├── QA_REPORT.html                     # Standalone Interactive HTML QA Dashboard
├── parabank_full_api_126_report.html  # Full 126 REST API Execution Report
├── parabank_hybrid_ui_api_report.html # Hybrid UI/API Test Execution Report
├── cucumber.js                        # Cucumber runner configuration
├── playwright.config.js               # Playwright test configuration
├── package.json                       # Scripts, dependencies, and metadata
└── README.md                          # Repository documentation
```

---

## BDD Feature & Scenario Coverage

The 93 behavior-driven scenarios are categorized into 13 modules, tagged for granular execution:

| # | Feature File | Module Tag | Description | Scenarios |
|---|---|---|---|:---:|
| 1 | `registration.feature` | `@module:registration` | Customer onboarding, blank submissions, password mismatch, duplicate accounts | 7 |
| 2 | `login.feature` | `@module:login` | Credential verification, invalid passwords, empty inputs, session logout | 6 |
| 3 | `navigation.feature` | `@module:navigation` | Global header, footer, side navigation, unauthenticated redirects | 8 |
| 4 | `accounts_overview.feature` | `@module:accounts-overview` | Real-time balance display, account rows, account activity links | 5 |
| 5 | `open_account.feature` | `@module:open-account` | Opening new Checking & Savings accounts, initial deposit confirmation | 5 |
| 6 | `transfer_funds.feature` | `@module:transfer-funds` | Inter-account fund transfers, source/destination dropdowns, confirmations | 4 |
| 7 | `bill_pay.feature` | `@module:bill-pay` | Bill payments, mismatch account numbers, blank fields, payee receipts | 5 |
| 8 | `find_transactions.feature` | `@module:find-transactions` | Searching transactions by ID, date, date range, and dollar amount | 6 |
| 9 | `update_contact.feature` | `@module:update-contact` | Profile updates, address modifications, persistence checks | 4 |
| 10 | `request_loan.feature` | `@module:request-loan` | Loan requests, down payments, blank fields, high balance boundary tests | 5 |
| 11 | `session_management.feature` | `@module:session` | Authentication persistence across navigation, post-logout protections | 4 |
| 12 | `security.feature` | `@module:security` | SQL injection resilience, XSS sanitization, direct URL authorization | 7 |
| 13 | `ui_usability.feature` | `@module:ui-usability` | Responsive viewports, contrast, tab index navigation, form ergonomics | 27 |
| **Total** | **13 Feature Files** | | **Comprehensive Functional, Edge, & Security Coverage** | **93** |

---

## HTML Execution Reports & Test Analysis

The framework produces clean, interactive HTML reports designed for test engineers, QA leads, and stakeholders.

### 1. Enterprise QA Test Dashboard (`QA_REPORT.html`)
- **KPI Summary Cards**: Total test cases, overall pass rate, module breakdown, execution runtime, and environment telemetry.
- **Interactive Multi-Level Drill Down**:
  - **Level 1**: Module-level summary with progress bars and pass/fail badges.
  - **Level 2**: Scenario list with tags (`@smoke`, `@sanity`, `@module:*`).
  - **Level 3**: 2x2 Scenario Detail Card providing **Test Data**, **Execution Steps**, **Expected Results**, and **Actual Results**.
- **Real-Time Search & Filters**: Filter by status (`Pass`, `Fail`, `All`) and module dynamically with zero external dependencies.

```bash
# Generate the latest BDD HTML Dashboard from test results
npm run report:bdd
```

### 2. Native Cucumber HTML Report (`test-results/cucumber-report.html`)
Configured in `cucumber.js` to automatically output standard Cucumber Gherkin step breakdowns and timings.

### 3. Playwright Trace & HTML Report
For native Playwright specs and API testing:
```bash
npm run test:report    # Opens Playwright's native HTML report
npm run report:api     # Opens REST API execution report
```

---

## Getting Started & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` (bundled with Node.js)
- Supported OS: Windows, macOS, Linux

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

### 2. Install Project Dependencies
```bash
npm install
```

### 3. Install Playwright Browsers
```bash
npx playwright install --with-deps chromium
```

---

## Test Execution Guide

All execution commands are accessible via configured `npm` scripts in `package.json`.

### 1. Running BDD Cucumber Tests

```bash
# Run all 93 BDD scenarios
npm run test:bdd
```

### 2. Running by Test Tier

The scenarios are tagged according to standard QA test pyramids:

```bash
# Fast sanity check on critical business paths (~5 scenarios)
npm run test:bdd:smoke

# Broad build health check (~15 scenarios)
npm run test:bdd:sanity

# Comprehensive regression suite (all 93 scenarios)
npm run test:bdd:regression
```

### 3. Running by Feature Module

Target specific domain functionality during feature development or bug fixes:

```bash
npm run test:bdd:module:registration     # Customer Registration
npm run test:bdd:module:login            # Authentication & Logout
npm run test:bdd:module:navigation       # Navigation & Menus
npm run test:bdd:module:accounts         # Accounts Overview
npm run test:bdd:module:open-account     # Open Checking/Savings
npm run test:bdd:module:transfer         # Transfer Funds
npm run test:bdd:module:bill-pay         # Bill Payment
npm run test:bdd:module:find-transactions# Transaction History & Search
npm run test:bdd:module:update-contact   # Profile Update
npm run test:bdd:module:request-loan     # Loan Application
npm run test:bdd:module:session          # Session Management
npm run test:bdd:module:security         # Security & Boundary Tests
npm run test:bdd:module:ui-usability     # Responsive & Usability Tests
```

### 4. Running REST API & Hybrid Test Suites

In addition to BDD, the framework contains pure API integration suites and hybrid tests:

```bash
# Run all 126 pure REST API tests
npm run test:api

# Run specific API modules
npm run test:api:auth                    # Authentication endpoints
npm run test:api:accounts                # Accounts REST API
npm run test:api:transactions            # Transactions REST API
npm run test:api:loans                   # Loan application API

# Run Hybrid UI + API tests
npm run test:hybrid
```

### 5. Generating Reports

```bash
# Generate BDD Markdown summary and Enterprise HTML Dashboard
npm run report:bdd

# Generate Playwright spec HTML report
npm run report:html
```

---

## Configuration & Environment Variables

Control runtime behavior via environment variables:

| Variable | Default Value | Options | Description |
|---|---|---|---|
| `HEADLESS` | `true` | `true`, `false` | Run browser in headless or headed UI mode |
| `PARABANK_BASE_URL` | `https://parabank.parasoft.com/parabank/` | Valid URL | Target ParaBank deployment endpoint |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` | Console logger verbosity |
| `TAGS` | `@regression` | Any tag expression | Cucumber tag filter override |

**Example: Run tests in headed browser with debug logging:**
```bash
# PowerShell (Windows)
$env:HEADLESS="false"; $env:LOG_LEVEL="debug"; npm run test:bdd:smoke

# Bash (macOS/Linux)
HEADLESS=false LOG_LEVEL=debug npm run test:bdd:smoke
```

---

## CI/CD Pipeline

Continuous Integration is configured via **GitHub Actions** (`.github/workflows/playwright.yml`):
- Triggers automatically on `push` and `pull_request` to `main` and `master`.
- Installs Node dependencies and Playwright browser binaries with system dependencies.
- Executes automated test suites in a headless Ubuntu runner.
- Uploads HTML test reports and traces as downloadable workflow artifacts retained for 30 days.

---

## Framework Extensibility Guide

The decoupled Two-Layer architecture makes adding new tests straightforward:

### Adding a New BDD Feature:
1. **Create the Feature File**: Add `features/your_feature.feature` with standard Gherkin syntax:
   ```gherkin
   Feature: Transfer Verification
     Scenario: Transfer funds between checking accounts
       Given I navigate to the transfer funds page
       When I transfer "$50.00" from checking to savings
       Then the transfer confirmation should appear
   ```
2. **Implement Page Objects** in `pages/YourFeaturePage.js` extending `BasePage` and `BaseActions`.
3. **Add Step Definitions** in `features/step_definitions/steps.js` utilizing the Page Object methods and `Assertions`.
4. **Execute**: Run `npx cucumber-js features/your_feature.feature`.
