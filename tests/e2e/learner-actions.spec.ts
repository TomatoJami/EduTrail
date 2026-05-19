import { expect, Page, test } from '@playwright/test';
import { adminEmail, e2ePassword, login, openBasicAlgebra, resetE2EData, studentEmail } from './helpers';

async function markCurrentStepIfNeeded(page: Page) {
  const markButton = page.getByRole('button', { name: /mark as complete/i });

  if (await markButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await markButton.click();
  }
}

test.describe('learner account and course actions', () => {
  test.beforeEach(() => {
    resetE2EData();
  });

  test('student updates learning preferences', async ({ page }) => {
    await login(page);

    await page.goto('/account/preferences');
    await expect(page.getByRole('heading', { name: /your preferences/i })).toBeVisible();

    await page.getByLabel(/programming/i).check();
    await page.getByLabel(/grades 4-9/i).check();
    await page.getByRole('button', { name: /save preferences/i }).click();

    await expect(page.getByText(/preferences saved successfully/i)).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(/programming/i)).toBeChecked();
    await expect(page.getByLabel(/grades 4-9/i)).toBeChecked();
  });

  test('student adds a course to bookmarks and sees it on the home page', async ({ page }) => {
    await login(page);
    await openBasicAlgebra(page);

    await page.getByRole('button', { name: /bookmark course/i }).click();
    await expect(page.getByRole('button', { name: /remove bookmark/i })).toBeVisible();

    await page.goto('/');
    await page.getByRole('button', { name: /saved/i }).click();
    await expect(page.getByText(/basic algebra/i).first()).toBeVisible();
  });

  test('student starts a course and reaches the first chapter', async ({ page }) => {
    await login(page);
    await openBasicAlgebra(page);

    await page.getByRole('button', { name: /start learning/i }).click();

    await expect(page).toHaveURL(/\/courses\/[^/]+\/[^/]+$/);
    await expect(page.getByRole('heading', { name: /what is algebra/i })).toBeVisible();
    await expect(page.getByText(/algebra uses symbols/i)).toBeVisible();
  });

  test('student completes the whole seeded course', async ({ page }) => {
    await login(page);
    await openBasicAlgebra(page);

    await page.getByRole('button', { name: /start learning/i }).click();
    await expect(page.getByRole('heading', { name: /what is algebra/i })).toBeVisible();

    await markCurrentStepIfNeeded(page);
    await page.getByRole('button', { name: /^next/i }).click();

    await expect(page.getByRole('heading', { name: /quiz/i })).toBeVisible();
    await page.getByRole('button', { name: /^B\.\s*4$/i }).click();
    await page.getByPlaceholder(/enter your answer/i).fill('JavaScript');
    await page.getByPlaceholder(/answer for blank 1/i).fill('8');
    await page.getByRole('button', { name: /submit quiz/i }).click();

    await expect(page.getByText(/you scored 3 out of 3/i)).toBeVisible();
    await markCurrentStepIfNeeded(page);
    await page.getByRole('button', { name: /finish module/i }).click();

    await expect(page.getByRole('heading', { name: /congratulations/i })).toBeVisible();
    await page.getByRole('button', { name: /finish course/i }).click();

    await expect(page.getByRole('heading', { name: /basic algebra/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /visit again/i })).toBeVisible();
  });

  test('student submits feedback and admin can see it', async ({ page }) => {
    const feedbackText = `E2E feedback ${Date.now()}`;

    await login(page);
    await page.goto('/feedback');
    await page.locator('select').selectOption('Wish');
    await page.getByPlaceholder(/write your issue or suggestion/i).fill(feedbackText);
    await page.getByRole('button', { name: /send feedback/i }).click();

    await expect(page.getByText(/feedback submitted successfully/i)).toBeVisible();

    await page.evaluate(() => window.localStorage.clear());
    await login(page, adminEmail, e2ePassword);
    await page.goto('/admin/feedback');

    await expect(page.getByText(feedbackText)).toBeVisible();
    await expect(page.getByText(studentEmail)).toBeVisible();
  });
});
