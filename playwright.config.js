import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000', trace: 'retain-on-failure',
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS ?? '["--no-sandbox", "--disable-dev-shm-usage"]') } } : {}),
  },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }, { name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: [
    { command: 'node apps/api/src/server.js', env: { DEMO_MODE: 'true', PORT: '4000', HOST: '127.0.0.1', NODE_ENV: 'test' }, url: 'http://127.0.0.1:4000/health', timeout: 30000, reuseExistingServer: false },
    { command: 'npm run start -w @escudo/web', url: 'http://127.0.0.1:3000', timeout: 30000, reuseExistingServer: false },
  ],
});
