import type { BrowserContext, Cookie } from '@playwright/test';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Cookie name Odysee uses to persist the auth token on the web client. */
export const AUTH_COOKIE_NAME = 'auth_token';

/** Default base URL – override with BASE_URL env var. */
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:1337';

/** The HTTP request header that carries the token to the API. */
export const AUTH_HEADER = 'X-Lbry-Auth-Token';

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

/**
 * Build a Playwright Cookie object for the Odysee auth token.
 * Works for both `localhost` (dev) and any custom domain set via BASE_URL.
 */
export function buildAuthCookie(token: string): Cookie {
  const hostname = new URL(BASE_URL).hostname;

  return {
    name: AUTH_COOKIE_NAME,
    value: token,
    domain: hostname,
    path: '/',
    expires: -1, // session cookie; Odysee renews it on page load
    httpOnly: false,
    secure: false, // localhost is not https
    sameSite: 'Lax',
  };
}

/**
 * Inject an Odysee auth token as a cookie into an existing browser context.
 *
 * Call this **before** navigating when you need an ad-hoc authenticated
 * session outside of the normal storageState workflow.
 *
 * @example
 * const ctx = await browser.newContext();
 * await injectAuthToken(ctx, process.env.ODYSEE_AUTH_TOKEN!);
 * const page = await ctx.newPage();
 * await page.goto('/');
 */
export async function injectAuthToken(context: BrowserContext, token: string): Promise<void> {
  await context.addCookies([buildAuthCookie(token)]);
}

// ---------------------------------------------------------------------------
// StorageState helpers
// ---------------------------------------------------------------------------

/**
 * Converts a raw token string into a Playwright `storageState`-compatible
 * object so you can pass it directly to `browser.newContext({ storageState })`.
 *
 * @example
 * const ctx = await browser.newContext({
 *   storageState: tokenToStorageState(process.env.ODYSEE_AUTH_TOKEN!),
 * });
 */
export function tokenToStorageState(token: string) {
  return {
    cookies: [buildAuthCookie(token)],
    origins: [] as const,
  };
}

// ---------------------------------------------------------------------------
// Environment guards
// ---------------------------------------------------------------------------

/**
 * Returns the value of `ODYSEE_AUTH_TOKEN` from the environment.
 * Throws a clear error if it is not set – use at the top of auth-gated tests
 * or in fixture setup to give developers an actionable message.
 *
 * @example
 * const token = requireAuthToken();
 * await injectAuthToken(context, token);
 */
export function requireAuthToken(): string {
  const token = process.env.ODYSEE_AUTH_TOKEN;
  if (!token) {
    throw new Error(
      [
        '',
        '─────────────────────────────────────────────────────',
        '  ODYSEE_AUTH_TOKEN is not set.',
        '',
        '  Authenticated tests need a valid Odysee auth token.',
        '  You can get one from your browser cookies after',
        '  logging in to the app (cookie name: "auth_token").',
        '',
        '  Add it to a .env.test file in the project root:',
        '    ODYSEE_AUTH_TOKEN=your_token_here',
        '',
        '  Or export it in your shell before running tests:',
        '    export ODYSEE_AUTH_TOKEN=your_token_here',
        '─────────────────────────────────────────────────────',
        '',
      ].join('\n')
    );
  }
  return token;
}

/**
 * Like `requireAuthToken` but returns `null` instead of throwing when the
 * token is absent.  Use this when a test should **skip** rather than fail
 * if no credentials are available.
 *
 * @example
 * const token = optionalAuthToken();
 * test.skip(!token, 'Skipped – set ODYSEE_AUTH_TOKEN to run');
 */
export function optionalAuthToken(): string | null {
  return process.env.ODYSEE_AUTH_TOKEN ?? null;
}

// ---------------------------------------------------------------------------
// Channel helpers
// ---------------------------------------------------------------------------

/**
 * Returns the test channel name from the environment (`ODYSEE_TEST_CHANNEL`).
 * This should be the channel handle including the `@`, e.g. `@mychannel`.
 * Returns `null` if not set.
 */
export function getTestChannel(): string | null {
  return process.env.ODYSEE_TEST_CHANNEL ?? null;
}

/**
 * Like `getTestChannel` but throws if the channel is not configured.
 */
export function requireTestChannel(): string {
  const channel = process.env.ODYSEE_TEST_CHANNEL;
  if (!channel) {
    throw new Error(
      [
        '',
        '─────────────────────────────────────────────────────',
        '  ODYSEE_TEST_CHANNEL is not set.',
        '',
        '  Channel-specific tests require a channel handle.',
        '  Example: ODYSEE_TEST_CHANNEL=@mychannel',
        '─────────────────────────────────────────────────────',
        '',
      ].join('\n')
    );
  }
  return channel.startsWith('@') ? channel : `@${channel}`;
}
