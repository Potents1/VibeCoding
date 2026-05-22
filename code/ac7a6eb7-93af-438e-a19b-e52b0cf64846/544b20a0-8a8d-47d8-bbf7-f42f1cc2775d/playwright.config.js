/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: __dirname,
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4173',
    headless: true
  },
  webServer: {
    command: 'node scripts/serve-static.mjs',
    port: 4173,
    reuseExistingServer: true,
    timeout: 30_000
  }
};

export default config;
