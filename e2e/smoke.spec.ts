import { test, expect } from '@playwright/test';

const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const canRunE2e = Boolean(process.env.PLAYWRIGHT_BASE_URL) || hasSupabaseEnv;

test.describe('smoke', () => {
  test.skip(!canRunE2e, 'Set PLAYWRIGHT_BASE_URL or Supabase env vars to run e2e');

  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
