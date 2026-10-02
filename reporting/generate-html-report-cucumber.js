#!/usr/bin/env node
/**
 * reporting/generate-html-report-cucumber.js
 * ───────────────────────────────────────────
 * Generates an enterprise-grade "QA Automation Test Report Dashboard" HTML report
 * from test-results/cucumber-results.json.
 *
 * Strict Constraints Applied:
 * - 100% Vanilla HTML and Inline CSS (style="..." attributes on tags).
 * - Single <style> block in <head> ONLY for essential interactive elements (details/summary markers, hover effects).
 * - Polished Dark SaaS Aesthetic (#0f172a / #0b0f19).
 * - Level 1 (Module) -> Level 2 (Scenario) -> Level 3 (2x2 Scenario Detail Card: Test Data, Test Steps, Expected Result, Actual Result).
 */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CUCUMBER_JSON = path.join(ROOT, 'test-results', 'cucumber-results.json');
const REPORT_OUT = path.join(ROOT, 'test-results', 'QA_REPORT.html');

if (!fs.existsSync(CUCUMBER_JSON)) {
  console.error(`[ERROR] ${CUCUMBER_JSON} not found. Run Cucumber BDD tests first.`);
  process.exit(1);
}

const raw = fs.readFileSync(CUCUMBER_JSON, 'utf-8');
const features = JSON.parse(raw);

const allScenarios = [];
for (const feature of features) {
  for (const element of feature.elements || []) {
    if (element.type === 'scenario') {
      allScenarios.push({
        featureName: feature.name,
        featureDescription: feature.description || '',
        uri: feature.uri,
        ...element
      });
    }
  }
}

let passedCount = 0;
let failedCount = 0;
let skippedCount = 0;
let totalDurationNs = 0;

const details = [];

for (const scenario of allScenarios) {
  let status = 'passed';
  let errorMsg = '';
  let durationNs = 0;
  const stepsList = [];

  const rawSteps = (scenario.steps || []).filter(s => !s.hidden && s.keyword !== 'Before' && s.keyword !== 'After');

  for (const step of scenario.steps || []) {
    if (step.result) {
      durationNs += (step.result.duration || 0);
      if (step.result.status === 'failed') {
        status = 'failed';
        errorMsg = step.result.error_message || 'Step execution failed';
      } else if (step.result.status === 'skipped' && status !== 'failed') {
        status = 'skipped';
      }
    }
  }

  for (const s of rawSteps) {
    const sStatus = s.result ? s.result.status : 'unknown';
    stepsList.push({
      keyword: s.keyword ? s.keyword.trim() : 'Step',
      name: s.name || '',
      status: sStatus
    });
  }

  totalDurationNs += durationNs;

  if (status === 'passed') passedCount++;
  else if (status === 'failed') failedCount++;
  else skippedCount++;

  const tag = (scenario.tags && scenario.tags.length > 0) ? scenario.tags[0].name : '';

  details.push({
    featureName: scenario.featureName,
    uri: scenario.uri,
    title: scenario.name,
    tag,
    status,
    durationMs: Math.round(durationNs / 1000000),
    errorMsg,
    steps: stepsList
  });
}

const total = allScenarios.length;
const passRate = total > 0 ? ((passedCount / total) * 100).toFixed(1) : '0';
const totalSeconds = totalDurationNs / 1000000000;
const durFmt = totalSeconds < 60 ? `${totalSeconds.toFixed(1)}s` : `${Math.floor(totalSeconds / 60)}m ${Math.round(totalSeconds % 60)}s`;
const runDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' });

// Group scenarios by feature
const byFeature = {};
for (const spec of details) {
  const k = spec.featureName;
  if (!byFeature[k]) byFeature[k] = { passed: 0, failed: 0, skipped: 0, specs: [], file: spec.uri };
  byFeature[k].specs.push(spec);
  if (spec.status === 'passed') byFeature[k].passed++;
  else if (spec.status === 'failed') byFeature[k].failed++;
  else byFeature[k].skipped++;
}

function esc(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripAnsi(s) {
  return (s || '').replace(/\x1b\[[0-9;]*m/g, '');
}

// Generates structured Test Data object JSON for each scenario
function generateTestData(spec) {
  const data = {
    scenarioId: spec.tag || 'TC-GENERIC',
    module: spec.featureName,
    executionMode: 'Single Shared Browser Context',
  };

  // Extract quotes or parameters from step names or title
  const matches = [];
  for (const st of spec.steps) {
    const qMatches = [...st.name.matchAll(/"([^"]+)"/g)];
    for (const m of qMatches) matches.push(m[1]);
  }

  if (matches.length > 0) {
    data.inputParameters = {};
    matches.forEach((val, idx) => {
      data.inputParameters[`param_${idx + 1}`] = val;
    });
  } else {
    data.environment = {
      baseUrl: 'https://parabank.parasoft.com/parabank/',
      browser: 'Chromium Desktop',
      viewport: '1280x800'
    };
  }

  return JSON.stringify(data, null, 2);
}

// Generates clean Expected Result text
function deriveExpectedResult(spec) {
  const thenStep = spec.steps.find(s => s.keyword === 'Then' || s.keyword === 'And');
  if (thenStep) {
    return `The framework expects: "${esc(thenStep.keyword)} ${esc(thenStep.name)}". The application DOM should render the target locator and respond within timeout limits without application errors.`;
  }
  return `The framework expects all Given/When/Then assertions for "${esc(spec.title)}" to evaluate true without DOM locator timeouts or application exceptions.`;
}

// Generates clean Actual Result block
function deriveActualResult(spec) {
  if (spec.status === 'passed') {
    return `<div style="font-size: 13px; color: #34d399; line-height: 1.6;">
      <strong style="color: #34d399;">✅ PASSED</strong><br>
      Scenario completed successfully in ${spec.durationMs}ms. All step assertions matched expected locators, text, and response parameters without error.
    </div>`;
  } else if (spec.status === 'failed') {
    const cleanErr = esc(stripAnsi(spec.errorMsg || 'Step assertion failed or timed out.'));
    return `<div style="font-size: 13px; color: #f87171; line-height: 1.6;">
      <strong style="color: #f87171;">❌ FAILED</strong><br>
      Execution threw an exception or locator timeout during scenario execution:
      <pre style="margin-top: 8px; margin-bottom: 0; background: #070a12; border: 1px solid rgba(248, 113, 113, 0.3); border-radius: 6px; padding: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #f87171; overflow-x: auto; white-space: pre-wrap; max-height: 180px;">${cleanErr}</pre>
    </div>`;
  } else {
    return `<div style="font-size: 13px; color: #fbbf24; line-height: 1.6;">
      <strong style="color: #fbbf24;">⚠️ SKIPPED</strong><br>
      Scenario step execution was skipped due to earlier module error or environment timeout.
    </div>`;
  }
}

// Build HTML document
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QA Automation Test Report Dashboard</title>
<style>
  /* Essential interactive styling only */
  summary::-webkit-details-marker { display: none !important; }
  summary { list-style: none !important; }
  
  .module-details[open] > summary .mod-chevron {
    transform: rotate(90deg);
  }
  .scenario-details[open] > summary .scen-chevron {
    transform: rotate(90deg);
  }

  .mod-summary:hover {
    background-color: #1e293b !important;
    border-color: #475569 !important;
  }
  .scen-summary:hover {
    background-color: #1a2436 !important;
    border-color: #3b82f6 !important;
  }

  .action-btn:hover {
    filter: brightness(1.2);
    cursor: pointer;
  }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; min-height: 100vh;">

<!-- TOP HEADER NAVBAR -->
<div style="background: #0f172a; border-bottom: 1px solid #1e293b; padding: 18px 40px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
  <div style="display: flex; align-items: center; gap: 14px;">
    <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
      ⚡
    </div>
    <div>
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #f8fafc; letter-spacing: -0.5px;">QA Automation Test Report Dashboard</h1>
      <div style="font-size: 12px; color: #94a3b8; margin-top: 2px; display: flex; align-items: center; gap: 8px;">
        <span>ParaBank BDD Automation Suite</span>
        <span style="color: #334155;">•</span>
        <span>Cucumber JS &amp; Playwright</span>
        <span style="color: #334155;">•</span>
        <span>${esc(runDate)} (PKT)</span>
      </div>
    </div>
  </div>
  
  <div style="display: flex; align-items: center; gap: 10px;">
    <button onclick="toggleAllModules(true)" class="action-btn" style="background: #1e293b; border: 1px solid #334155; color: #e2e8f0; font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 8px; transition: all 0.2s;">
      Expand All
    </button>
    <button onclick="toggleAllModules(false)" class="action-btn" style="background: #1e293b; border: 1px solid #334155; color: #e2e8f0; font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 8px; transition: all 0.2s;">
      Collapse All
    </button>
  </div>
</div>

<!-- MAIN DASHBOARD CONTENT -->
<div style="max-width: 1360px; margin: 0 auto; padding: 32px 40px;">

  <!-- KPI CARDS GRID -->
  <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 28px;">
    
    <!-- Total Scenarios -->
    <div style="flex: 1 1 200px; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);">
      <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8;">Total Scenarios</div>
      <div style="font-size: 32px; font-weight: 700; color: #f8fafc; margin-top: 8px;">${total}</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">13 Testing Modules</div>
    </div>

    <!-- Passed -->
    <div style="flex: 1 1 200px; background: #0f172a; border: 1px solid rgba(52, 211, 153, 0.25); border-radius: 12px; padding: 20px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);">
      <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #34d399;">Passed Scenarios</div>
      <div style="font-size: 32px; font-weight: 700; color: #34d399; margin-top: 8px;">${passedCount}</div>
      <div style="font-size: 12px; color: #34d399; opacity: 0.8; margin-top: 4px;">${passRate}% Success Rate</div>
    </div>

    <!-- Failed -->
    <div style="flex: 1 1 200px; background: #0f172a; border: 1px solid rgba(248, 113, 113, 0.25); border-radius: 12px; padding: 20px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);">
      <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #f87171;">Failed Scenarios</div>
      <div style="font-size: 32px; font-weight: 700; color: #f87171; margin-top: 8px;">${failedCount}</div>
      <div style="font-size: 12px; color: #f87171; opacity: 0.8; margin-top: 4px;">Strict Assertions Enabled</div>
    </div>

    <!-- Execution Duration -->
    <div style="flex: 1 1 200px; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);">
      <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8;">Total Duration</div>
      <div style="font-size: 32px; font-weight: 700; color: #38bdf8; margin-top: 8px;">${durFmt}</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Sequential Single-Session</div>
    </div>

  </div>

  <!-- PROGRESS BAR -->
  <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px 20px; margin-bottom: 32px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 13px; font-weight: 600;">
      <span style="color: #94a3b8;">Suite Execution Health</span>
      <span style="color: #f8fafc;">${passRate}% Passed</span>
    </div>
    <div style="height: 10px; background: #1e293b; border-radius: 9999px; overflow: hidden; display: flex;">
      <div style="width: ${passRate}%; background: #34d399; height: 100%; transition: width 0.4s ease;"></div>
      <div style="width: ${total > 0 ? ((failedCount / total) * 100).toFixed(1) : 0}%; background: #f87171; height: 100%; transition: width 0.4s ease;"></div>
    </div>
  </div>

  <!-- SECTION TITLE -->
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
    <h2 style="margin: 0; font-size: 16px; font-weight: 700; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px;">
      <span>📦</span> TEST MODULES &amp; SCENARIOS
    </h2>
    <span style="font-size: 12px; color: #64748b;">Click any module or scenario to expand details</span>
  </div>

  <!-- LEVEL 1: MODULE ACCORDIONS -->
  <div id="modules-container">
  ${Object.entries(byFeature).map(([featureName, moduleData], modIdx) => {
    const isModulePassed = moduleData.failed === 0;
    const modBadgeBg = isModulePassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    const modBadgeColor = isModulePassed ? '#34d399' : '#f87171';
    const modBadgeBorder = isModulePassed ? '1px solid rgba(52, 211, 153, 0.25)' : '1px solid rgba(248, 113, 113, 0.25)';
    const modStatusText = isModulePassed ? 'PASSED' : 'FAILED';

    return `
    <!-- MODULE ACCORDION ROW (LEVEL 1) -->
    <details class="module-details" ${modIdx === 0 ? 'open' : ''} style="margin-bottom: 14px; border-radius: 12px; border: 1px solid #1e293b; background: #0f172a; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);">
      
      <summary class="mod-summary" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: #0f172a; cursor: pointer; user-select: none; transition: all 0.2s ease; border-bottom: 1px solid #1e293b;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="mod-chevron" style="display: inline-block; font-size: 12px; color: #38bdf8; transition: transform 0.2s ease;">▶</span>
          <span style="font-size: 16px; font-weight: 700; color: #f8fafc;">${esc(featureName)}</span>
          <span style="font-size: 11px; background: #1e293b; border: 1px solid #334155; color: #94a3b8; padding: 3px 10px; border-radius: 9999px; font-family: ui-monospace, monospace;">${esc(moduleData.file)}</span>
        </div>
        
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="font-size: 13px; color: #94a3b8; display: flex; align-items: center; gap: 12px;">
            <span>Total: <strong style="color: #f8fafc;">${moduleData.specs.length}</strong></span>
            <span style="color: #334155;">|</span>
            <span>Passed: <strong style="color: #34d399;">${moduleData.passed}</strong></span>
            <span style="color: #334155;">|</span>
            <span>Failed: <strong style="color: #f87171;">${moduleData.failed}</strong></span>
          </div>
          <span style="background: ${modBadgeBg}; color: ${modBadgeColor}; border: ${modBadgeBorder}; border-radius: 9999px; padding: 4px 14px; font-weight: 700; font-size: 11px; letter-spacing: 0.5px;">
            ${modStatusText}
          </span>
        </div>
      </summary>

      <!-- LEVEL 2: SCENARIOS LIST INSIDE MODULE -->
      <div style="padding: 16px; background: #070a12;">
      ${moduleData.specs.map((spec, scenIdx) => {
        const isScenPassed = spec.status === 'passed';
        const scenBadgeBg = isScenPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        const scenBadgeColor = isScenPassed ? '#34d399' : '#f87171';
        const scenBadgeBorder = isScenPassed ? '1px solid rgba(52, 211, 153, 0.25)' : '1px solid rgba(248, 113, 113, 0.25)';
        const scenStatusText = isScenPassed ? 'PASSED' : 'FAILED';

        const testDataJson = generateTestData(spec);
        const expectedText = deriveExpectedResult(spec);
        const actualResultHtml = deriveActualResult(spec);

        const actualBoxBorder = isScenPassed ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(248, 113, 113, 0.4)';
        const actualBoxBg = isScenPassed ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.06)';

        return `
        <!-- SCENARIO ACCORDION ROW (LEVEL 2) -->
        <details class="scenario-details" style="margin-bottom: 10px; border-radius: 8px; border: 1px solid #1e293b; background: #0f172a; overflow: hidden;">
          
          <summary class="scen-summary" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #0f172a; cursor: pointer; user-select: none; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="scen-chevron" style="display: inline-block; font-size: 10px; color: #94a3b8; transition: transform 0.2s ease;">▶</span>
              ${spec.tag ? `<span style="font-size: 11px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); padding: 2px 8px; border-radius: 4px; font-family: ui-monospace, monospace;">${esc(spec.tag)}</span>` : ''}
              <span style="font-size: 14px; font-weight: 600; color: #e2e8f0;">${esc(spec.title)}</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 14px;">
              <span style="font-size: 12px; color: #64748b; font-family: ui-monospace, monospace;">${spec.durationMs}ms</span>
              <span style="background: ${scenBadgeBg}; color: ${scenBadgeColor}; border: ${scenBadgeBorder}; border-radius: 9999px; padding: 3px 10px; font-weight: 700; font-size: 11px; letter-spacing: 0.5px;">
                ${scenStatusText}
              </span>
            </div>
          </summary>

          <!-- LEVEL 3: DETAILED SCENARIO VIEW CARD (2x2 FLEX LAYOUT) -->
          <div style="padding: 20px; background: #090d16; border-top: 1px solid #1e293b;">
            
            <div style="display: flex; flex-wrap: wrap; gap: 16px; width: 100%;">
              
              <!-- 1. TEST DATA -->
              <div style="flex: 1 1 calc(50% - 8px); min-width: 300px; background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; box-sizing: border-box;">
                <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                  <span>📦</span> TEST DATA
                </div>
                <pre style="margin: 0; background: #070a12; border: 1px solid #1e293b; border-radius: 6px; padding: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #38bdf8; overflow-x: auto; white-space: pre-wrap; line-height: 1.5;">${esc(testDataJson)}</pre>
              </div>

              <!-- 2. TEST STEPS -->
              <div style="flex: 1 1 calc(50% - 8px); min-width: 300px; background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; box-sizing: border-box;">
                <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                  <span>📋</span> EXECUTION STEPS
                </div>
                <ol style="margin: 0; padding-left: 20px; color: #e2e8f0; font-size: 13px; line-height: 1.7;">
                ${spec.steps.map(st => {
                  const isStPassed = st.status === 'passed';
                  const stColor = isStPassed ? '#34d399' : (st.status === 'failed' ? '#f87171' : '#94a3b8');
                  return `<li><span style="color: ${stColor}; font-weight: 700;">${esc(st.keyword)}</span> ${esc(st.name)}</li>`;
                }).join('\n')}
                </ol>
              </div>

              <!-- 3. EXPECTED RESULT -->
              <div style="flex: 1 1 calc(50% - 8px); min-width: 300px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; box-sizing: border-box;">
                <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                  <span>🎯</span> EXPECTED RESULT
                </div>
                <div style="font-size: 13px; color: #e2e8f0; line-height: 1.6; background: #070a12; border: 1px solid #1e293b; border-radius: 6px; padding: 12px;">
                  ${expectedText}
                </div>
              </div>

              <!-- 4. ACTUAL RESULT -->
              <div style="flex: 1 1 calc(50% - 8px); min-width: 300px; background: ${actualBoxBg}; border: ${actualBoxBorder}; border-radius: 8px; padding: 16px; box-sizing: border-box;">
                <div style="font-size: 11px; font-weight: 700; color: ${isScenPassed ? '#34d399' : '#f87171'}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                  <span>${isScenPassed ? '🔍' : '🔴'}</span> ACTUAL RESULT ${isScenPassed ? '(SUCCESS)' : '(FAILURE)'}
                </div>
                ${actualResultHtml}
              </div>

            </div>

          </div>

        </details>
        `;
      }).join('\n')}
      </div>

    </details>
    `;
  }).join('\n')}
  </div>

</div>

<!-- FOOTER -->
<div style="border-top: 1px solid #1e293b; padding: 24px 40px; text-align: center; color: #64748b; font-size: 12px; background: #070a12;">
  Enterprise QA Automation Test Dashboard &nbsp;•&nbsp; ParaBank BDD Framework &nbsp;•&nbsp; Auto-generated Report
</div>

<script>
  function toggleAllModules(openState) {
    const modules = document.querySelectorAll('.module-details');
    modules.forEach(m => m.open = openState);
  }
</script>

</body>
</html>`;

fs.writeFileSync(REPORT_OUT, html, 'utf-8');
console.log(`✅ Enterprise QA Dashboard HTML Report generated: ${REPORT_OUT}`);
console.log(`    Total: ${total}  |  Passed: ${passedCount}  |  Skipped: ${skippedCount}  |  Failed: ${failedCount}`);
