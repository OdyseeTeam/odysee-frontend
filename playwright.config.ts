import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Odysee Frontend – Playwright Configuration
 *
 * Projects:
 *   setup          – saves auth cookie state once (skipped if ODYSEE_AUTH_TOKEN is absent)
 *   chromium       – unauthenticated tests (all specs NOT inside /authenticated/)
 *   chromium:auth  – authenticated tests   (specs inside /authenticated/, uses saved state)
 *   mobile:chrome  – smoke tests on a Pixel 5 viewport
 *
 * Environment variables:
 *   BASE_URL            override the target origin  (default: http://localhost:1337)
 *   ODYSEE_AUTH_TOKEN   raw auth_token cookie value used by auth.setup.ts
 *   ODYSEE_TEST_CHANNEL channel name used in channel/authenticated tests  (e.g. @mychannel)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:1337';
const AUTH_STATE = path.join(__dirname, 'tests/.auth/user.json');

export default defineConfig({
  testDir: './tests/specs',

  /* Run test files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in source */
  forbidOnly: !!process.env.CI,

  /* Retry on CI, no retries locally */
  retries: process.env.CI ? 2 : 0,

  /* Single worker on CI to avoid port conflicts; auto on local */
  workers: process.env.CI ? 1 : undefined,

  /* Reporters */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ...(process.env.CI ? ([['github']] as any) : []),
  ],

  /* Shared settings for every project */
  use: {
    baseURL: BASE_URL,

    /* Collect a trace on the first retry so failures are easy to debug */
    trace: 'on-first-retry',

    /* Screenshot only when a test fails */
    screenshot: 'only-on-failure',

    /* Keep video on failure */
    video: 'retain-on-failure',

    /* Generous timeout for SSR pages */
    navigationTimeout: 20_000,
    actionTimeout: 10_000,
  },

  /* Global timeout per test */
  timeout: 60_000,

  /* Output folder for screenshots / videos / traces */
  outputDir: 'test-results',

  projects: [
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Auth setup — runs once, writes tests/.auth/user.json
    //    Skipped gracefully when ODYSEE_AUTH_TOKEN is not set.
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'setup',
      testMatch: /.*auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Unauthenticated – Desktop Chrome
    //    Runs every spec that is NOT inside the /authenticated/ folder.
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/authenticated/**', '**/perf/**'],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Authenticated – Desktop Chrome
    //    Picks up only specs inside /authenticated/.
    //    Depends on the setup project so auth state is ready before these run.
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'chromium:auth',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE,
      },
      dependencies: ['setup'],
      testMatch: ['**/authenticated/**'],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Mobile smoke – Pixel 5
    //    Only runs smoke specs so mobile CI stays fast.
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'mobile:chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: ['**/smoke/**'],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Firefox – unauthenticated only (opt-in via --project=firefox)
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: ['**/authenticated/**'],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Performance – render-count baselines (opt-in via --project=perf)
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'perf',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/perf/**'],
    },
  ],
});
