# EduTrail E2E Tests

End-to-end tests use Playwright and run against the real Next.js frontend plus the Express backend.

## What You Need First

Create a separate MongoDB database or Atlas cluster for E2E tests. Do not use your development or production database, because the E2E seed clears test collections before inserting fresh data.

Copy the test environment example:

```cmd
copy backend\.env.test.example backend\.env.test
```

Then edit `backend\.env.test`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edutrail_test?retryWrites=true&w=majority&appName=EduTrailTest
JWT_SECRET=change_me_to_a_long_random_test_secret
DEFAULT_ADMIN_EMAIL=admin@test.com
DEFAULT_ADMIN_PASSWORD=12345678A!
E2E_USER_EMAIL=student@test.com
E2E_USER_PASSWORD=12345678A!
```

Keep the database name or cluster name clearly test-related, for example `edutrail_test`, `EduTrailTest`, or `e2e`. The seed script refuses to clear data unless `NODE_ENV=test` and the database URI looks like a test database, unless the explicit reset flag is enabled.

## Install Browser

```cmd
npx playwright install chromium
```

Run this once after installing dependencies or after Playwright asks for browsers.

## Run E2E Tests

```cmd
npm run test:e2e
```

This command:

1. Loads `backend/.env.test`.
2. Seeds the test database with a learner, admin, subjects, courses, chapters, and questions.
3. Starts the Next.js frontend and backend test server.
4. Runs Playwright tests.

Interactive mode:

```cmd
npm run test:e2e:ui
```

Headed browser mode:

```cmd
npm run test:e2e:headed
```

## Seeded Users

By default, the seed creates this learner:

```text
student@test.com / 12345678A!
```

And this admin:

```text
admin@test.com / 12345678A!
```

Override them in `backend/.env.test`:

```env
E2E_USER_EMAIL=student@test.com
E2E_USER_PASSWORD=12345678A!
DEFAULT_ADMIN_EMAIL=admin@test.com
DEFAULT_ADMIN_PASSWORD=12345678A!
```

You can also override the learner for one terminal session:

```cmd
set E2E_USER_EMAIL=student@test.com
set E2E_USER_PASSWORD=12345678A!
npm run test:e2e
```

## Manual Seed

To reset and seed the E2E database without running Playwright:

```cmd
npm run seed:e2e
```

Use this only with `backend/.env.test` pointing at a test database. The command enables `ALLOW_E2E_DB_RESET=true` internally so the script can clear and recreate E2E data.

## Useful Notes

`npm test` runs unit/component tests with Vitest.

`npm run test:e2e` runs browser E2E tests with Playwright.

Generated videos, traces, and reports are written to `test-results/` and `playwright-report/`.
