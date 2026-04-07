import { test as setup, expect } from '@playwright/test';
import { buildAuthCookie, optionalAuthToken } from './helpers/auth';
import fs from 'fs';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '.auth/user.json');

// ---------------------------------------------------------------------------
// Auth setup
// ---------------------------------------------------------------------------
// This file is matched by the "setup" project in playwright.config.ts and runs
// once before any authenticated test project.
//
// What it does:
//   1. If ODYSEE_AUTH_TOKEN is set → inject the auth_token cookie, navigate
//      to the app, and save the full storage state (cookies + localStorage)
//      to tests/.auth/user.json.
//   2. If the token is absent → write an empty state file so Playwright doesn't
//      error when it tries to load storageState for the chromium:auth project.
//      Authenticated specs will skip themselves via optionalAuthToken() guards.
//
// How to provide the token:
//   Option A – .env.test in the project root (recommended for local dev):
//     ODYSEE_AUTH_TOKEN=your_raw_cookie_value_here
//
//   Option B – shell export (CI / one-off runs):
//     export ODYSEE_AUTH_TOKEN=your_raw_cookie_value_here
//     pnpm test:e2e
//
//   Option C – inline:
//     ODYSEE_AUTH_TOKEN=xxx pnpm test:e2e
//
// Getting your token:
//   1. Open the app in Chrome and log in.
//   2. Open DevTools → Application → Cookies → select the site.
//   3. Copy the value of the cookie named "auth_token".
// ---------------------------------------------------------------------------

setup('save auth state', async ({ page }) => {
  const token = optionalAuthToken();

  // Ensure the output directory exists regardless of whether we have a token.
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  if (!token) {
    console.warn(
      '\n⚠️  ODYSEE_AUTH_TOKEN is not set.\n' +
        '   Writing empty auth state – authenticated tests will be skipped.\n' +
        '   See tests/auth.setup.ts for instructions on setting the token.\n'
    );

    // Write a valid but empty state file so the chromium:auth project doesn't
    // crash trying to load storageState before the authenticated specs skip.
    const emptyState = { cookies: [], origins: [] };
    fs.writeFileSync(AUTH_FILE, JSON.stringify(emptyState, null, 2));
    return;
  }

  // ── Step 1: Load the app so the domain context is established ─────────────
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // ── Step 2: Inject the auth_token cookie ──────────────────────────────────
  await page.context().addCookies([buildAuthCookie(token)]);

  // ── Step 3: Reload so the app picks up the cookie and hydrates the session ─
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // ── Step 4: Sanity-check – the "Log In" link should no longer be visible ───
  // If the app is still showing the sign-in button after cookie injection, the
  // token may be invalid or expired.  We warn rather than hard-fail so that a
  // stale token doesn't block the entire run.
  const signInLink = page.getByRole('link', { name: /log in/i });
  const isSignedIn = !(await signInLink.isVisible({ timeout: 8_000 }).catch(() => false));

  if (!isSignedIn) {
    console.warn(
      '\n⚠️  Auth cookie was injected but the app still shows "Log In".\n' +
        '   The token may be invalid or expired.\n' +
        '   Authenticated tests may fail or be skipped.\n'
    );
  } else {
    console.log('✅  Auth cookie accepted – user appears to be signed in.');
  }

  // ── Step 5: Save the full context state (cookies + localStorage) ──────────
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`💾  Auth state saved to: ${AUTH_FILE}`);
});
