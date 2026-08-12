import { defineConfig, devices } from '@playwright/test';

const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

/**
 * E2E is optional for CI until secrets are wired.
 * Set PLAYWRIGHT_BASE_URL (and Supabase env vars for a live app) to run locally.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  // Only start a local server when running against localhost with env present.
  webServer:
    hasSupabaseEnv && !process.env.PLAYWRIGHT_BASE_URL
      ? {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        }
      : undefined,
});
