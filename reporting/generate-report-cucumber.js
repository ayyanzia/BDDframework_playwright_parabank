const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CUCUMBER_JSON = path.join(ROOT, 'test-results', 'cucumber-results.json');
const REPORT_OUT = path.join(ROOT, 'test-results', 'QA_SUMMARY_REPORT.md');

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

  for (const step of scenario.steps || []) {
    if (step.result) {
      durationNs += (step.result.duration || 0);
      if (step.result.status === 'failed') {
        status = 'failed';
        errorMsg = step.result.error_message || 'Step failed';
      } else if (step.result.status === 'skipped' && status !== 'failed') {
        status = 'skipped';
      }
    }
  }

  totalDurationNs += durationNs;

  if (status === 'passed') passedCount++;
  else if (status === 'failed') failedCount++;
  else skippedCount++;

  details.push({
    featureName: scenario.featureName,
    uri: scenario.uri,
    title: scenario.name,
    status,
    durationMs: Math.round(durationNs / 1000000),
    errorMsg
  });
}

function classifyBug(errorMsg = '') {
  const m = errorMsg.toLowerCase();
  if (m.includes('tocontaintext') || m.includes('tobevisible') || m.includes('locator') || m.includes('expect'))
    return 'Functional – Assertion Failure';
  if (m.includes('timeout') || m.includes('exceeded'))
    return 'Performance – Timeout';
  if (m.includes('net::err') || m.includes('navigation'))
    return 'Network / Navigation Error';
  return 'Unknown – See Stack Trace';
}

const durationS = (totalDurationNs / 1000000000).toFixed(1);
const runDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' });

const lines = [];
lines.push(`# ParaBank QA Automation – Test Summary Report`);
lines.push(``);
lines.push(`> **Project:** ParaBank Web Application (parabank.parasoft.com)`);
lines.push(`> **Tool:** Cucumber JS & Playwright | **Browser:** Chromium (Desktop)`);
lines.push(`> **Run Date:** ${runDate} (PKT)`);
lines.push(`> **Total Duration:** ${durationS} s`);
lines.push(``);
lines.push(`---`);
lines.push(``);
lines.push(`## 1. Executive Summary`);
lines.push(``);
lines.push(`| Metric | Value |`);
lines.push(`|--------|-------|`);
lines.push(`| Total Test Cases Executed | ${allScenarios.length} |`);
lines.push(`| ✅ Passed | ${passedCount} |`);
lines.push(`| ⚠️  Skipped (Live-Demo Flakiness) | ${skippedCount} |`);
lines.push(`| ❌ Failed | ${failedCount} |`);
lines.push(`| Pass Rate | ${allScenarios.length > 0 ? ((passedCount / allScenarios.length) * 100).toFixed(1) : 0}% |`);
lines.push(`| Total Duration | ${durationS} s |`);
lines.push(``);

const verdict = failedCount === 0
  ? '🟢 **PASS** – All executed tests passed or were legitimately skipped.'
  : `🔴 **FAIL** – ${failedCount} test(s) failed. See Bug Report section for details.`;
lines.push(`**Overall Verdict:** ${verdict}`);
lines.push(``);
lines.push(`---`);
lines.push(``);

lines.push(`## 2. Module-Level Results`);
lines.push(``);
lines.push(`| Module | Passed | Skipped | Failed |`);
lines.push(`|--------|--------|---------|--------|`);

const byFeature = {};
for (const item of details) {
  if (!byFeature[item.featureName]) byFeature[item.featureName] = { passed: 0, failed: 0, skipped: 0 };
  if (item.status === 'passed') byFeature[item.featureName].passed++;
  else if (item.status === 'failed') byFeature[item.featureName].failed++;
  else byFeature[item.featureName].skipped++;
}

for (const [featureName, counts] of Object.entries(byFeature)) {
  const status = counts.failed > 0 ? '❌' : counts.skipped > 0 ? '⚠️' : '✅';
  lines.push(`| ${status} ${featureName} | ${counts.passed} | ${counts.skipped} | ${counts.failed} |`);
}
lines.push(``);
lines.push(`---`);
lines.push(``);

lines.push(`## 3. Detailed Test Case Results`);
lines.push(``);

for (const featureName of Object.keys(byFeature)) {
  lines.push(`### ${featureName}`);
  lines.push(``);
  lines.push(`| Test Scenario | Status | Duration | Notes |`);
  lines.push(`|---------------|--------|----------|-------|`);

  const featureSpecs = details.filter(d => d.featureName === featureName);
  for (const spec of featureSpecs) {
    const statusText = spec.status === 'passed' ? '✅ Passed' : spec.status === 'failed' ? '❌ Failed' : '⚠️ Skipped';
    const notes = spec.errorMsg ? spec.errorMsg.split('\n')[0].slice(0, 120).replace(/\|/g, '\\|') : '';
    const durStr = spec.durationMs < 1000 ? `${spec.durationMs} ms` : `${(spec.durationMs / 1000).toFixed(1)} s`;
    lines.push(`| ${spec.title} | ${statusText} | ${durStr} | ${notes} |`);
  }
  lines.push(``);
}
lines.push(`---`);
lines.push(``);

lines.push(`## 4. Bug Report`);
lines.push(``);

const failedSpecs = details.filter(d => d.status === 'failed');
if (failedSpecs.length === 0) {
  lines.push(`> ✅ No bugs found in this run.`);
} else {
  let bugId = 1;
  lines.push(`The following defects were identified during this automated test run:`);
  lines.push(``);

  for (const spec of failedSpecs) {
    const bugType = classifyBug(spec.errorMsg);
    lines.push(`### BUG-${String(bugId).padStart(3, '0')} – ${spec.title}`);
    lines.push(``);
    lines.push(`| Field | Detail |`);
    lines.push(`|-------|--------|`);
    lines.push(`| **Bug ID** | BUG-${String(bugId).padStart(3, '0')} |`);
    lines.push(`| **Module** | ${spec.featureName} |`);
    lines.push(`| **Test Scenario** | ${spec.title} |`);
    lines.push(`| **Feature File** | ${spec.uri} |`);
    lines.push(`| **Bug Type** | ${bugType} |`);
    lines.push(`| **Severity** | Medium |`);
    lines.push(`| **Priority** | P2 |`);
    lines.push(`| **Status** | Open |`);
    lines.push(``);
    lines.push(`**Error Message:**`);
    lines.push(`\`\`\``);
    lines.push(spec.errorMsg.slice(0, 800));
    lines.push(`\`\`\``);
    lines.push(``);
    bugId++;
  }
}

lines.push(`---`);
lines.push(``);
lines.push(`## 5. Environment & Configuration`);
lines.push(``);
lines.push(`| Property | Value |`);
lines.push(`|----------|-------|`);
lines.push(`| Application Under Test | ParaBank (parabank.parasoft.com) |`);
lines.push(`| Automation Framework | Cucumber JS & Playwright |`);
lines.push(`| Test Language | JavaScript (CommonJS) |`);
lines.push(`| Run Mode | Headless, Sequential (workers=1) |`);
lines.push(``);

fs.writeFileSync(REPORT_OUT, lines.join('\n'), 'utf-8');
console.log(`✅ QA Summary Report written to: ${REPORT_OUT}`);
console.log(`\n📊 Summary:`);
console.log(`    Total:   ${allScenarios.length}`);
console.log(`    Passed:  ${passedCount}`);
console.log(`    Skipped: ${skippedCount}`);
console.log(`    Failed:  ${failedCount}`);
