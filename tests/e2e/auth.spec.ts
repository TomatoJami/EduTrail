import { expect, test } from '@playwright/test';
import { login, resetE2EData, studentEmail } from './helpers';

test.describe('authenticated learner flow', () => {
  test.beforeEach(() => {
    resetE2EData();
  });

  test('student logs in and lands on the authenticated home page', async ({ page }) => {
    await login(page);

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const rawUser = window.localStorage.getItem('user');
          return rawUser ? JSON.parse(rawUser).email : null;
        })
      )
      .toBe(studentEmail);

    await expect(page.getByRole('button', { name: /in progress/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /saved/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /completed/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /master your skills/i })).toBeHidden();
  });

  test('student can open the course catalog after logging in', async ({ page }) => {
    await login(page);

    await page.goto('/courses');

    await expect(page.getByText(/recommended for you/i)).toBeVisible();
    await expect(page.getByText(/basic algebra/i).first()).toBeVisible();
  });
});
