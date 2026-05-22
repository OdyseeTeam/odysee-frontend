import { test, expect, type BrowserContext, type Page } from '../../fixtures';
import { BASE_URL, optionalAuthToken } from '../../helpers/auth';
import { lbryioCallRoute, mockLbryRpc } from '../../helpers/lbryRpc';
import { ROUTES } from '../../helpers/routes';

const COOKIE_MAX_AGE_SECONDS = 60 * 60;
const CORRECT_PASSWORD = 'correct-password';
const STALE_PASSWORD = 'stale-password';
const SYNC_HASH = 'sync-hash';

test.beforeEach(async () => {
  const token = optionalAuthToken();
  test.skip(!token, 'Skipped - set ODYSEE_AUTH_TOKEN to run authenticated tests');
});

test.describe('Wallet unlock sync recovery', () => {
  test('redirects when encrypted and locked wallet has no saved password', async ({ page }) => {
    const rpc = await mockLbryRpc(
      page,
      {
        wallet_status: { is_encrypted: true, is_locked: true },
      },
      {
        unexpectedMethods: ['wallet_unlock', 'sync_apply', 'sync_hash'],
      }
    );
    const syncGetCalls = await failSyncGet(page);

    await openAppAndTriggerSync(page);

    await expect(page).toHaveURL(/\/\$\/walletpassword/);
    expect(rpc.callsFor('wallet_unlock')).toHaveLength(0);
    expect(rpc.callsFor('sync_apply')).toHaveLength(0);
    expect(rpc.callsFor('sync_hash')).toHaveLength(0);
    expect(syncGetCalls).toHaveLength(0);

    const state = await getSyncState(page);
    expect(state.syncDeferredDueToMissingPassword).toBe(true);
    expect(state.syncApplyPasswordError).toBe(false);
  });

  test('redirects with password error when saved password is stale', async ({ page, context }) => {
    await setSavedPasswordCookie(context, STALE_PASSWORD);

    const rpc = await mockLbryRpc(
      page,
      {
        wallet_status: { is_encrypted: true, is_locked: true },
        wallet_unlock: false,
      },
      {
        unexpectedMethods: ['sync_apply', 'sync_hash'],
      }
    );
    const syncGetCalls = await failSyncGet(page);

    await openAppAndTriggerSync(page);

    await expect(page).toHaveURL(/\/\$\/walletpassword/);
    expect(
      rpc.callsFor('wallet_unlock').some((call) => (call.params as { password?: string })?.password === STALE_PASSWORD)
    ).toBe(true);
    expect(rpc.callsFor('sync_apply')).toHaveLength(0);
    expect(rpc.callsFor('sync_hash')).toHaveLength(0);
    expect(syncGetCalls).toHaveLength(0);

    const state = await getSyncState(page);
    expect(state.syncApplyPasswordError).toBe(true);
  });

  test('proceeds when saved password is correct', async ({ page, context }) => {
    await setSavedPasswordCookie(context, CORRECT_PASSWORD);
    await mockSyncGet(page, {
      hash: SYNC_HASH,
      changed: false,
      data: {},
    });

    const rpc = await mockLbryRpc(page, {
      wallet_status: { is_encrypted: true, is_locked: true },
      wallet_unlock: true,
      sync_hash: SYNC_HASH,
    });

    await openAppAndTriggerSync(page);

    await expect.poll(() => rpc.callsFor('sync_hash').length).toBeGreaterThan(0);
    await expect(page).not.toHaveURL(/\/\$\/walletpassword/);
    expect(
      rpc
        .callsFor('wallet_unlock')
        .some((call) => (call.params as { password?: string })?.password === CORRECT_PASSWORD)
    ).toBe(true);

    const state = await getSyncState(page);
    expect(state.getSyncIsPending).toBe(false);
    expect(state.syncDeferredDueToMissingPassword).toBe(false);
    expect(state.syncApplyPasswordError).toBe(false);
  });

  test('does not regress unencrypted wallets', async ({ page }) => {
    await mockSyncGet(page, {
      hash: SYNC_HASH,
      changed: false,
      data: {},
    });

    const rpc = await mockLbryRpc(
      page,
      {
        wallet_status: { is_encrypted: false, is_locked: false },
        sync_hash: SYNC_HASH,
      },
      {
        unexpectedMethods: ['wallet_unlock'],
      }
    );

    await openAppAndTriggerSync(page);

    await expect.poll(() => rpc.callsFor('sync_hash').length).toBeGreaterThan(0);
    await expect(page).not.toHaveURL(/\/\$\/walletpassword/);
    expect(rpc.callsFor('wallet_unlock')).toHaveLength(0);

    const state = await getSyncState(page);
    expect(state.getSyncIsPending).toBe(false);
    expect(state.syncDeferredDueToMissingPassword).toBe(false);
    expect(state.syncApplyPasswordError).toBe(false);
  });

  test('clears deferred flag on successful password recovery without server push', async ({ page }) => {
    await mockSyncGet(page, {
      hash: SYNC_HASH,
      changed: false,
      data: {},
    });

    await mockLbryRpc(page, {
      wallet_status: { is_encrypted: true, is_locked: true },
      wallet_unlock: true,
      sync_hash: SYNC_HASH,
    });

    await page.goto(ROUTES.walletPassword);
    await waitForAuthenticatedApp(page);
    await dispatchAction(page, 'SYNC_DEFERRED_SET', true);

    await page.locator('input[name="sync-password"]').fill(CORRECT_PASSWORD);
    await page.getByRole('button', { name: /^Continue$/ }).click();

    await expect.poll(() => syncDeferred(page)).toBe(false);
  });

  test('redirects after an open modal closes', async ({ page }) => {
    await page.goto(ROUTES.home);
    await waitForAuthenticatedApp(page);

    await dispatchAction(page, 'SHOW_MODAL', {
      id: 'test_blocking_modal',
      modalProps: {},
    });
    await dispatchAction(page, 'SYNC_DEFERRED_SET', true);

    await expect(page).not.toHaveURL(/\/\$\/walletpassword/);

    await dispatchAction(page, 'HIDE_MODAL');

    await expect(page).toHaveURL(/\/\$\/walletpassword/);
  });
});

async function setSavedPasswordCookie(context: BrowserContext, value: string) {
  const hostname = new URL(BASE_URL).hostname;

  await context.addCookies([
    {
      name: 'saved_password',
      value,
      domain: hostname,
      path: '/',
      expires: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SECONDS,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

async function mockSyncGet(page: Page, response: Record<string, unknown>) {
  await page.route(lbryioCallRoute('sync', 'get'), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: response,
      }),
    });
  });
}

async function failSyncGet(page: Page) {
  const calls: Array<string> = [];

  await page.route(lbryioCallRoute('sync', 'get'), async (route) => {
    calls.push(route.request().url());
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: 'Unexpected sync/get call',
      }),
    });
  });

  return calls;
}

async function openAppAndTriggerSync(page: Page) {
  await page.goto(ROUTES.home);
  await waitForAuthenticatedApp(page);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
}

async function waitForAuthenticatedApp(page: Page) {
  await page.waitForFunction(() => Boolean((window as any).store?.getState?.().user?.user?.has_verified_email));
}

async function getSyncState(page: Page) {
  await expect
    .poll(() => page.evaluate(() => Boolean((window as any).store.getState().sync.getSyncIsPending)))
    .toBe(false);
  return page.evaluate(() => (window as any).store.getState().sync);
}

async function syncDeferred(page: Page) {
  return page.evaluate(() => (window as any).store.getState().sync.syncDeferredDueToMissingPassword);
}

async function dispatchAction(page: Page, type: string, data?: unknown) {
  await page.evaluate((action) => (window as any).store.dispatch(action), { type, data });
}
