// Playwright config for tools/shots.spec.js.
// Run from the repo root with the site served on :8000:
//   python3 -m http.server 8000
//   npx --prefix tools playwright test -c tools/playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: 'shots.spec.js',
  outputDir: 'test-results',
  timeout: 200000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:8000',
    browserName: 'chromium',
  },
  projects: [
    {
      name: 'narrow',
      use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    },
    {
      name: 'wide',
      use: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    },
  ],
});
