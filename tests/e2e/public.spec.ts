import { expect, test } from '@playwright/test';

test('home page renders the public landing experience', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /master your skills/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  await expect(page.getByText(/why choose edutrail/i)).toBeVisible();
});

test('login page exposes the expected auth form', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
  await expect(page.getByPlaceholder(/enter your email/i)).toBeVisible();
  await expect(page.getByPlaceholder(/enter your password/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
});

test('protected courses page sends anonymous users to login', async ({ page }) => {
  await page.goto('/courses');

  await expect(page).toHaveURL(/\/login$/);
});
