import { defineConfig, devices } from '@playwright/test';

const frontendPort = process.env.E2E_FRONTEND_PORT || '3000';
const backendPort = process.env.E2E_BACKEND_PORT || '5000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['html'], ['list']],
  use: {
    baseURL: `http://localhost:${frontendPort}`,
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'on',
  },
  webServer: [
    {
      command: `npm run dev -- --port ${frontendPort}`,
      url: `http://localhost:${frontendPort}`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: `npm --prefix backend run dev:test`,
      url: `http://localhost:${backendPort}/api/health`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
