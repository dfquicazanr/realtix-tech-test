// Karma needs a Chrome binary. Playwright already downloads one for the e2e
// suite, so both suites run on the same browser locally and in CI.
process.env.CHROME_BIN =
  process.env.CHROME_BIN || require('@playwright/test').chromium.executablePath();

module.exports = function (config) {
  config.set({
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      },
    },
    reporters: ['progress'],
    restartOnFileChange: true,
  });
};
