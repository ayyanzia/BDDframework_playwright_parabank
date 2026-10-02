module.exports = {
  default: {
    require: [
      'features/support/*.js',
      'features/step_definitions/*.js'
    ],
    format: [
      'progress-bar',
      'json:test-results/cucumber-results.json',
      'html:test-results/cucumber-report.html'
    ],
    paths: ['features/**/*.feature'],
    publishQuiet: true
  }
};
