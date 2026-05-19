import { expect, Page } from '@playwright/test';
import { execFileSync } from 'child_process';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

export const studentEmail = process.env.E2E_USER_EMAIL || 'student@test.com';
export const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@test.com';
export const e2ePassword = process.env.E2E_USER_PASSWORD || '12345678A!';

export function resetE2EData() {
  const command = process.platform === 'win32' ? 'cmd.exe' : 'npm';
  const args =
    process.platform === 'win32'
      ? ['/d', '/s', '/c', 'npm run seed:e2e']
      : ['run', 'seed:e2e'];

  execFileSync(command, args, {
    cwd: repoRoot,
    env: process.env,
    stdio: 'pipe',
  });
}

export async function login(page: Page, email = studentEmail, password = e2ePassword) {
  await page.goto('/login');
  await page.getByPlaceholder(/enter your email/i).fill(email);
  await page.getByPlaceholder(/enter your password/i).fill(password);
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect
    .poll(async () =>
      page.evaluate((expectedEmail) => {
        const rawUser = window.localStorage.getItem('user');
        return rawUser ? JSON.parse(rawUser).email === expectedEmail : false;
      }, email)
    )
    .toBe(true);
}

export async function openBasicAlgebra(page: Page) {
  await page.goto('/courses');
  await page.locator('a[href^="/courses/"]').filter({ hasText: /basic algebra/i }).first().click();
  await expect(page).toHaveURL(/\/courses\/[^/]+$/);
  await expect(page.locator('h1').filter({ hasText: /basic algebra/i })).toBeVisible();
}
