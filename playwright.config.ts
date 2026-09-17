import { defineConfig, devices } from '@playwright/test';

try {
  process.loadEnvFile('.env');
} catch {
  // No .env file (e.g. in CI, where env vars are provided directly).
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'Desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 667 } },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
