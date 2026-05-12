/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: 'Version 4.0/tests/e2e',
  timeout: 30000,
  use: {
    headless: true
  }
};
