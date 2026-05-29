import { test, expect, type BrowserContext, type Page } from '../../fixtures';
import { BASE_URL, optionalAuthToken } from '../../helpers/auth';
import { lbryioCallRoute, LbryRpcError, mockLbryRpc } from '../../helpers/lbryRpc';
import { ROUTES } from '../../helpers/routes';

const COOKIE_MAX_AGE_SECONDS = 60 * 60;
const CORRECT_PASSWORD = 'correct-password';
const STALE_PASSWORD = 'stale-password';
const SYNC_HASH = 'sync-hash';
const LOCAL_HASH = 'local-hash';
const SERVER_HASH = 'server-hash';
const RECOVERED_SERVER_HASH = 'recovered-server-hash';
const VICTIM_BLOB = 'victim-blob';
const REAL_ENCRYPTED_BLOB = 'real-encrypted-blob';
const PROBE_HASH = 'probe-hash';
const PROBE_DATA = 'probe-data';
const REPACK_HASH = 'repack-hash';
const REPACK_DATA = 'repack-data';
const SHARED_LOCAL_HASH = 'shared-local-hash';

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

  test('silently recovers historic victim with no saved password', async ({ page }) => {
    await mockSyncGet(page, {
      hash: SERVER_HASH,
      changed: true,
      data: VICTIM_BLOB,
    });
    const syncSetCalls = await mockSyncSet(page, {
      hash: RECOVERED_SERVER_HASH,
    });

    const rpc = await mockLbryRpc(page, {
      wallet_status: { is_encrypted: true, is_locked: false },
      sync_hash: LOCAL_HASH,
      sync_apply: (call) => {
        const params = call.params as { password?: string; data?: string };

        if (params.password === '' && params.data === VICTIM_BLOB) {
          return {
            hash: PROBE_HASH,
            data: PROBE_DATA,
          };
        }

        if (params.password === '' && params.data === undefined) {
          return {
            hash: REPACK_HASH,
            data: REPACK_DATA,
          };
        }

        return unexpectedRpcCall('sync_apply');
      },
      wallet_decrypt: true,
    });

    await openAppAndTriggerSync(page);

    await expect.poll(() => syncSetCalls.length).toBe(1);
    await expect(page).not.toHaveURL(/\/\$\/walletpassword/);

    const syncApplyCalls = rpc.callsFor('sync_apply');
    expect(syncApplyCalls).toHaveLength(2);
    expect(syncApplyCalls[0].params).toMatchObject({
      password: '',
      data: VICTIM_BLOB,
      blocking: true,
    });
    expect(syncApplyCalls[1].params).toMatchObject({
      password: '',
    });
    expect((syncApplyCalls[1].params as { data?: string }).data).toBeUndefined();
    expect(rpc.callsFor('wallet_decrypt')).toHaveLength(1);
    expect(syncSetCalls[0]).toMatchObject({
      old_hash: SERVER_HASH,
      new_hash: REPACK_HASH,
      data: REPACK_DATA,
    });

    const state = await getSyncState(page);
    expect(state.syncHash).toBe(RECOVERED_SERVER_HASH);
    expect(state.lastSyncHash).toBe(RECOVERED_SERVER_HASH);
    expect(state.syncDeferredDueToMissingPassword).toBe(false);
    expect(state.syncApplyPasswordError).toBe(false);
  });

  test('silently recovers historic victim with stale saved password', async ({ page, context }) => {
    await setSavedPasswordCookie(context, STALE_PASSWORD);
    await mockSyncGet(page, {
      hash: SERVER_HASH,
      changed: true,
      data: VICTIM_BLOB,
    });
    const syncSetCalls = await mockSyncSet(page, {
      hash: RECOVERED_SERVER_HASH,
    });

    const rpc = await mockLbryRpc(page, {
      wallet_status: { is_encrypted: true, is_locked: false },
      sync_hash: LOCAL_HASH,
      sync_apply: (call) => {
        const params = call.params as { password?: string; data?: string };

        if (params.password === STALE_PASSWORD && params.data === VICTIM_BLOB) {
          return invalidPasswordError();
        }

        if (params.password === '' && params.data === VICTIM_BLOB) {
          return {
            hash: PROBE_HASH,
            data: PROBE_DATA,
          };
        }

        if (params.password === '' && params.data === undefined) {
          return {
            hash: REPACK_HASH,
            data: REPACK_DATA,
          };
        }

        return unexpectedRpcCall('sync_apply');
      },
      wallet_decrypt: true,
    });

    await openAppAndTriggerSync(page);

    await expect.poll(() => syncSetCalls.length).toBe(1);
    await expect(page).not.toHaveURL(/\/\$\/walletpassword/);

    const syncApplyCalls = rpc.callsFor('sync_apply');
    expect(syncApplyCalls).toHaveLength(3);
    expect(syncApplyCalls[0].params).toMatchObject({
      password: STALE_PASSWORD,
      data: VICTIM_BLOB,
      blocking: true,
    });
    expect(syncApplyCalls[1].params).toMatchObject({
      password: '',
      data: VICTIM_BLOB,
      blocking: true,
    });
    expect(syncApplyCalls[2].params).toMatchObject({
      password: '',
    });
    expect((syncApplyCalls[2].params as { data?: string }).data).toBeUndefined();
    expect(rpc.callsFor('wallet_decrypt')).toHaveLength(1);
    expect(syncSetCalls[0]).toMatchObject({
      old_hash: SERVER_HASH,
      new_hash: REPACK_HASH,
      data: REPACK_DATA,
    });
    expect(await getSavedPasswordCookie(context)).toBeUndefined();

    const state = await getSyncState(page);
    expect(state.syncHash).toBe(RECOVERED_SERVER_HASH);
    expect(state.lastSyncHash).toBe(RECOVERED_SERVER_HASH);
    expect(state.syncApplyPasswordError).toBe(false);
  });

  test('does not re-save stale password after form-submit recovery', async ({ page, context }) => {
    await setSavedPasswordCookie(context, STALE_PASSWORD);
    let recoveryEnabled = false;
    let recovered = false;
    await mockSyncGet(page, () => ({
      hash: SERVER_HASH,
      changed: recoveryEnabled,
      data: VICTIM_BLOB,
    }));
    const syncSetCalls = await mockSyncSet(page, {
      hash: RECOVERED_SERVER_HASH,
    });

    await mockLbryRpc(page, {
      wallet_status: () => ({ is_encrypted: !recovered, is_locked: false }),
      sync_hash: LOCAL_HASH,
      sync_apply: (call) => {
        const params = call.params as { password?: string; data?: string };

        if (params.password === STALE_PASSWORD && params.data === VICTIM_BLOB) {
          return invalidPasswordError();
        }

        if (params.password === '' && params.data === VICTIM_BLOB) {
          return {
            hash: PROBE_HASH,
            data: PROBE_DATA,
          };
        }

        if (params.password === '' && params.data === undefined) {
          return {
            hash: REPACK_HASH,
            data: REPACK_DATA,
          };
        }

        return unexpectedRpcCall('sync_apply');
      },
      wallet_decrypt: () => {
        recovered = true;
        return true;
      },
    });

    await page.goto(ROUTES.walletPassword);
    await waitForAuthenticatedApp(page);
    await getSyncState(page);
    await page.locator('input[name="sync-password"]').fill(STALE_PASSWORD);
    recoveryEnabled = true;
    await page.getByRole('button', { name: /^Continue$/ }).click();

    await expect.poll(() => syncSetCalls.length).toBe(1);
    await expect(page).not.toHaveURL(/\/\$\/walletpassword/);
    expect(await getSavedPasswordCookie(context)).toBeUndefined();

    const state = await getSyncState(page);
    expect(state.historicVictimRecoveredAt).not.toBeNull();

    recoveryEnabled = false;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect.poll(() => getHistoricVictimRecoveredAt(page)).toBeNull();
  });

  test('saves submitted password when form submit does not recover historic victim', async ({ page, context }) => {
    let submitEnabled = false;
    await mockSyncGet(page, () => ({
      hash: SERVER_HASH,
      changed: submitEnabled,
      data: REAL_ENCRYPTED_BLOB,
    }));

    const rpc = await mockLbryRpc(page, {
      wallet_status: { is_encrypted: true, is_locked: false },
      sync_hash: LOCAL_HASH,
      sync_apply: (call) => {
        const params = call.params as { password?: string; data?: string };

        if (params.password === CORRECT_PASSWORD && params.data === REAL_ENCRYPTED_BLOB) {
          return {
            hash: SERVER_HASH,
            data: REAL_ENCRYPTED_BLOB,
          };
        }

        return unexpectedRpcCall('sync_apply');
      },
      wallet_decrypt: unexpectedRpcCall('wallet_decrypt'),
    });

    await page.goto(ROUTES.walletPassword);
    await waitForAuthenticatedApp(page);
    await getSyncState(page);
    await page.locator('input[name="sync-password"]').fill(CORRECT_PASSWORD);
    submitEnabled = true;
    await page.getByRole('button', { name: /^Continue$/ }).click();

    await expect(page).not.toHaveURL(/\/\$\/walletpassword/);
    await expect.poll(() => getSavedPasswordCookie(context)).toBe(CORRECT_PASSWORD);
    expect(rpc.callsFor('sync_apply')).toHaveLength(1);
    expect(rpc.callsFor('wallet_decrypt')).toHaveLength(0);

    const state = await getSyncState(page);
    expect(state.historicVictimRecoveredAt).toBeNull();
  });

  test('falls through when empty-password probe fails for non-victim', async ({ page, context }) => {
    await setSavedPasswordCookie(context, STALE_PASSWORD);
    await mockSyncGet(page, {
      hash: SERVER_HASH,
      changed: true,
      data: REAL_ENCRYPTED_BLOB,
    });
    const syncSetCalls = await mockSyncSet(page, {
      hash: RECOVERED_SERVER_HASH,
    });

    const rpc = await mockLbryRpc(page, {
      wallet_status: { is_encrypted: true, is_locked: false },
      sync_hash: LOCAL_HASH,
      sync_apply: (call) => {
        const params = call.params as { password?: string; data?: string };

        if (params.password === STALE_PASSWORD && params.data === REAL_ENCRYPTED_BLOB) {
          return invalidPasswordError();
        }

        if (params.password === '' && params.data === REAL_ENCRYPTED_BLOB) {
          return invalidPasswordError();
        }

        if (params.password === CORRECT_PASSWORD && params.data === REAL_ENCRYPTED_BLOB) {
          return {
            hash: SERVER_HASH,
            data: REAL_ENCRYPTED_BLOB,
          };
        }

        return unexpectedRpcCall('sync_apply');
      },
      wallet_decrypt: unexpectedRpcCall('wallet_decrypt'),
    });

    await openAppAndTriggerSync(page);

    await expect(page).toHaveURL(/\/\$\/walletpassword/);
    expect(syncSetCalls).toHaveLength(0);
    expect(rpc.callsFor('wallet_decrypt')).toHaveLength(0);
    expect(await getSavedPasswordCookie(context)).toBe(STALE_PASSWORD);

    const syncApplyCalls = rpc.callsFor('sync_apply');
    expect(syncApplyCalls).toHaveLength(2);
    expect(syncApplyCalls[1].params).toMatchObject({
      password: '',
      data: REAL_ENCRYPTED_BLOB,
      blocking: true,
    });

    const state = await getSyncState(page);
    expect(state.syncApplyPasswordError).toBe(true);

    await page.locator('input[name="sync-password"]').fill(CORRECT_PASSWORD);
    await page.getByRole('button', { name: /^Continue$/ }).click();
    await expect(page).not.toHaveURL(/\/\$\/walletpassword/);

    const finalSyncApplyCalls = rpc.callsFor('sync_apply');
    expect(finalSyncApplyCalls).toHaveLength(3);
    expect(finalSyncApplyCalls[2].params).toMatchObject({
      password: CORRECT_PASSWORD,
      data: REAL_ENCRYPTED_BLOB,
      blocking: true,
    });
  });

  test('defers normally when no-saved-password probe fails for non-victim', async ({ page }) => {
    await mockSyncGet(page, {
      hash: SERVER_HASH,
      changed: true,
      data: REAL_ENCRYPTED_BLOB,
    });
    const syncSetCalls = await mockSyncSet(page, {
      hash: RECOVERED_SERVER_HASH,
    });

    const rpc = await mockLbryRpc(page, {
      wallet_status: { is_encrypted: true, is_locked: false },
      sync_hash: LOCAL_HASH,
      sync_apply: (call) => {
        const params = call.params as { password?: string; data?: string };

        if (params.password === '' && params.data === REAL_ENCRYPTED_BLOB) {
          return invalidPasswordError();
        }

        if (params.password === CORRECT_PASSWORD && params.data === REAL_ENCRYPTED_BLOB) {
          return {
            hash: SERVER_HASH,
            data: REAL_ENCRYPTED_BLOB,
          };
        }

        return unexpectedRpcCall('sync_apply');
      },
      wallet_decrypt: unexpectedRpcCall('wallet_decrypt'),
    });

    await openAppAndTriggerSync(page);

    await expect(page).toHaveURL(/\/\$\/walletpassword/);
    expect(syncSetCalls).toHaveLength(0);
    expect(rpc.callsFor('wallet_decrypt')).toHaveLength(0);

    const syncApplyCalls = rpc.callsFor('sync_apply');
    expect(syncApplyCalls).toHaveLength(1);
    expect(syncApplyCalls[0].params).toMatchObject({
      password: '',
      data: REAL_ENCRYPTED_BLOB,
      blocking: true,
    });

    const state = await getSyncState(page);
    expect(state.syncDeferredDueToMissingPassword).toBe(true);
    expect(state.syncApplyPasswordError).toBe(false);

    await page.locator('input[name="sync-password"]').fill(CORRECT_PASSWORD);
    await page.getByRole('button', { name: /^Continue$/ }).click();
    await expect(page).not.toHaveURL(/\/\$\/walletpassword/);

    const finalSyncApplyCalls = rpc.callsFor('sync_apply');
    expect(finalSyncApplyCalls).toHaveLength(2);
    expect(finalSyncApplyCalls[1].params).toMatchObject({
      password: CORRECT_PASSWORD,
      data: REAL_ENCRYPTED_BLOB,
      blocking: true,
    });
    expect(syncSetCalls).toHaveLength(0);
    expect(rpc.callsFor('wallet_decrypt')).toHaveLength(0);
  });

  test('recovers current session when wallet_decrypt persistence fails', async ({ page, context }) => {
    await setSavedPasswordCookie(context, STALE_PASSWORD);
    await mockSyncGet(page, {
      hash: SERVER_HASH,
      changed: true,
      data: VICTIM_BLOB,
    });
    const syncSetCalls = await mockSyncSet(page, {
      hash: RECOVERED_SERVER_HASH,
    });

    const rpc = await mockLbryRpc(page, {
      wallet_status: { is_encrypted: true, is_locked: false },
      sync_hash: LOCAL_HASH,
      sync_apply: (call) => {
        const params = call.params as { password?: string; data?: string };

        if (params.password === STALE_PASSWORD && params.data === VICTIM_BLOB) {
          return invalidPasswordError();
        }

        if (params.password === '' && params.data === VICTIM_BLOB) {
          return {
            hash: PROBE_HASH,
            data: PROBE_DATA,
          };
        }

        return unexpectedRpcCall('sync_apply');
      },
      wallet_decrypt: new LbryRpcError(-32500, 'wallet_decrypt failed'),
    });

    await openAppAndTriggerSync(page);

    await expect(page).not.toHaveURL(/\/\$\/walletpassword/);
    expect(await getSavedPasswordCookie(context)).toBeUndefined();
    expect(syncSetCalls).toHaveLength(0);
    expect(rpc.callsFor('wallet_decrypt')).toHaveLength(1);
    expect(rpc.callsFor('sync_apply')).toHaveLength(2);

    const state = await getSyncState(page);
    expect(state.syncHash).toBe(SERVER_HASH);
    expect(state.lastSyncHash).toBe(SERVER_HASH);
    expect(state.syncApplyPasswordError).toBe(false);
    expect(state.historicVictimRecoveredAt).not.toBeNull();
  });

  test('recovers current session when post-decrypt re-pack fails', async ({ page, context }) => {
    await setSavedPasswordCookie(context, STALE_PASSWORD);
    await mockSyncGet(page, {
      hash: SERVER_HASH,
      changed: true,
      data: VICTIM_BLOB,
    });
    const syncSetCalls = await mockSyncSet(page, {
      hash: RECOVERED_SERVER_HASH,
    });

    const rpc = await mockLbryRpc(page, {
      wallet_status: { is_encrypted: true, is_locked: false },
      sync_hash: LOCAL_HASH,
      sync_apply: (call) => {
        const params = call.params as { password?: string; data?: string };

        if (params.password === STALE_PASSWORD && params.data === VICTIM_BLOB) {
          return invalidPasswordError();
        }

        if (params.password === '' && params.data === VICTIM_BLOB) {
          return {
            hash: PROBE_HASH,
            data: PROBE_DATA,
          };
        }

        if (params.password === '' && params.data === undefined) {
          return new LbryRpcError(-32500, 're-pack failed');
        }

        return unexpectedRpcCall('sync_apply');
      },
      wallet_decrypt: true,
    });

    await openAppAndTriggerSync(page);

    await expect(page).not.toHaveURL(/\/\$\/walletpassword/);
    expect(await getSavedPasswordCookie(context)).toBeUndefined();
    expect(syncSetCalls).toHaveLength(0);
    expect(rpc.callsFor('wallet_decrypt')).toHaveLength(1);
    expect(rpc.callsFor('sync_apply')).toHaveLength(3);

    const state = await getSyncState(page);
    expect(state.syncHash).toBe(SERVER_HASH);
    expect(state.lastSyncHash).toBe(SERVER_HASH);
    expect(state.syncApplyPasswordError).toBe(false);
    expect(state.historicVictimRecoveredAt).not.toBeNull();
  });

  test('recovers current session when sync_set persistence fails', async ({ page, context }) => {
    await setSavedPasswordCookie(context, STALE_PASSWORD);
    let recovered = false;
    await mockSyncGet(page, {
      hash: SERVER_HASH,
      changed: true,
      data: VICTIM_BLOB,
    });
    let syncSetAttempts = 0;
    const syncSetCalls = await mockSyncSet(page, () => {
      syncSetAttempts += 1;

      if (syncSetAttempts === 1) {
        return {
          response: {
            error: 'sync/set failed',
          },
          status: 500,
        };
      }

      return {
        response: {
          hash: RECOVERED_SERVER_HASH,
        },
      };
    });

    const rpc = await mockLbryRpc(page, {
      wallet_status: () => ({ is_encrypted: !recovered, is_locked: false }),
      sync_hash: () => (recovered ? REPACK_HASH : LOCAL_HASH),
      sync_apply: (call) => {
        const params = call.params as { password?: string; data?: string };

        if (params.password === STALE_PASSWORD && params.data === VICTIM_BLOB) {
          return invalidPasswordError();
        }

        if (params.password === '' && params.data === VICTIM_BLOB) {
          if (recovered) {
            return {
              hash: REPACK_HASH,
              data: REPACK_DATA,
            };
          }

          return {
            hash: PROBE_HASH,
            data: PROBE_DATA,
          };
        }

        if (params.password === '' && params.data === undefined) {
          return {
            hash: REPACK_HASH,
            data: REPACK_DATA,
          };
        }

        return unexpectedRpcCall('sync_apply');
      },
      wallet_decrypt: () => {
        recovered = true;
        return true;
      },
    });

    await openAppAndTriggerSync(page);

    await expect.poll(() => syncSetCalls.length).toBe(1);
    await expect(page).not.toHaveURL(/\/\$\/walletpassword/);
    expect(await getSavedPasswordCookie(context)).toBeUndefined();
    expect(rpc.callsFor('wallet_decrypt')).toHaveLength(1);
    expect(rpc.callsFor('sync_apply')).toHaveLength(3);

    const state = await getSyncState(page);
    expect(state.syncHash).toBe(SERVER_HASH);
    expect(state.lastSyncHash).toBe(SERVER_HASH);
    expect(state.syncApplyPasswordError).toBe(false);
    expect(state.historicVictimRecoveredAt).not.toBeNull();

    await page.evaluate(() => window.dispatchEvent(new Event('focus')));

    await expect.poll(() => syncSetCalls.length).toBe(2);
    expect(rpc.callsFor('wallet_decrypt')).toHaveLength(1);

    const syncApplyCalls = rpc.callsFor('sync_apply');
    expect(syncApplyCalls).toHaveLength(4);
    expect(syncApplyCalls[3].params).toMatchObject({
      password: '',
      data: VICTIM_BLOB,
      blocking: true,
    });
    expect(syncSetCalls[1]).toMatchObject({
      old_hash: SERVER_HASH,
      new_hash: REPACK_HASH,
      data: REPACK_DATA,
    });

    const finalState = await getSyncState(page);
    expect(finalState.syncHash).toBe(RECOVERED_SERVER_HASH);
    expect(finalState.lastSyncHash).toBe(RECOVERED_SERVER_HASH);
    expect(finalState.syncApplyPasswordError).toBe(false);
  });

  test('prevents shared-preference corruption during multi-tab recovery', async ({ page, context }) => {
    await setSavedPasswordCookie(context, STALE_PASSWORD);
    const tabB = await context.newPage();
    const walletDecrypt = createDeferred<boolean>();
    let recovered = false;
    await mockSyncGet(page, {
      hash: SERVER_HASH,
      changed: true,
      data: VICTIM_BLOB,
    });
    await mockSyncGet(tabB, {
      hash: SERVER_HASH,
      changed: false,
      data: {},
    });
    const tabASyncSetCalls = await mockSyncSet(page, {
      hash: RECOVERED_SERVER_HASH,
    });
    const tabBSyncSetCalls = await mockSyncSet(tabB, {
      hash: RECOVERED_SERVER_HASH,
    });

    const tabARpc = await mockLbryRpc(page, {
      wallet_status: () => ({ is_encrypted: !recovered, is_locked: false }),
      sync_hash: () => (recovered ? REPACK_HASH : LOCAL_HASH),
      sync_apply: (call) => {
        const params = call.params as { password?: string; data?: string };

        if (params.password === STALE_PASSWORD && params.data === VICTIM_BLOB) {
          return invalidPasswordError();
        }

        if (params.password === '' && params.data === VICTIM_BLOB) {
          return {
            hash: PROBE_HASH,
            data: PROBE_DATA,
          };
        }

        if (params.password === '' && params.data === undefined) {
          return {
            hash: REPACK_HASH,
            data: REPACK_DATA,
          };
        }

        return unexpectedRpcCall('sync_apply');
      },
      wallet_decrypt: async () => {
        const result = await walletDecrypt.promise;
        recovered = true;
        return result;
      },
    });

    let tabBPreferenceSetCalled = false;
    const tabBRpc = await mockLbryRpc(tabB, {
      wallet_status: { is_encrypted: true, is_locked: false },
      sync_hash: () => (tabBPreferenceSetCalled ? SHARED_LOCAL_HASH : LOCAL_HASH),
      preference_get: null,
      preference_set: () => {
        tabBPreferenceSetCalled = true;
        return true;
      },
      sync_apply: unexpectedRpcCall('sync_apply'),
      wallet_unlock: unexpectedRpcCall('wallet_unlock'),
    });

    await openAppAndTriggerSync(page);
    await expect.poll(() => tabARpc.callsFor('wallet_decrypt').length).toBe(1);

    await openAppAndTriggerSync(tabB);
    await getSyncState(tabB);
    await dispatchAction(tabB, 'SET_PREFS_READY', true);
    await dispatchAction(tabB, 'SHARED_PREFERENCE_SET', {
      key: 'homepage',
      value: 'multi-tab-race',
    });

    await expect.poll(() => tabBRpc.callsFor('preference_set').length).toBe(1);
    await expect.poll(() => syncDeferred(tabB)).toBe(true);
    expect(tabBRpc.callsFor('sync_apply')).toHaveLength(0);
    expect(tabBSyncSetCalls).toHaveLength(0);

    walletDecrypt.resolve(true);

    await expect.poll(() => tabASyncSetCalls.length).toBe(1);
    expect(tabASyncSetCalls[0]).toMatchObject({
      old_hash: SERVER_HASH,
      new_hash: REPACK_HASH,
      data: REPACK_DATA,
    });
    expect(tabARpc.callsFor('sync_apply')).toHaveLength(3);

    const tabAState = await getSyncState(page);
    const tabBState = await getSyncState(tabB);
    expect(tabAState.fatalError).toBe(false);
    expect(tabBState.fatalError).toBe(false);
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

async function getSavedPasswordCookie(context: BrowserContext) {
  const cookies = await context.cookies(BASE_URL);
  return cookies.find((cookie) => cookie.name === 'saved_password')?.value;
}

async function mockSyncGet(page: Page, response: Record<string, unknown> | (() => Record<string, unknown>)) {
  await page.route(lbryioCallRoute('sync', 'get'), async (route) => {
    const data = typeof response === 'function' ? response() : response;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data,
      }),
    });
  });
}

type SyncSetMockResult = {
  response: Record<string, unknown>;
  status?: number;
};

async function mockSyncSet(
  page: Page,
  response: Record<string, unknown> | ((call: Record<string, unknown>) => SyncSetMockResult),
  status = 200
) {
  const calls: Array<Record<string, unknown>> = [];

  await page.route(lbryioCallRoute('sync', 'set'), async (route) => {
    const call = Object.fromEntries(new URLSearchParams(route.request().postData() || ''));
    const result = typeof response === 'function' ? response(call) : { response, status };
    const responseStatus = result.status ?? status;
    calls.push(call);
    await route.fulfill({
      status: responseStatus,
      contentType: 'application/json',
      body: JSON.stringify({
        success: responseStatus >= 200 && responseStatus < 300,
        ...(responseStatus >= 200 && responseStatus < 300 ? { data: result.response } : result.response),
      }),
    });
  });

  return calls;
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

async function getHistoricVictimRecoveredAt(page: Page) {
  return page.evaluate(() => (window as any).store.getState().sync.historicVictimRecoveredAt);
}

async function dispatchAction(page: Page, type: string, data?: unknown) {
  await page.evaluate((action) => (window as any).store.dispatch(action), { type, data });
}

function invalidPasswordError() {
  return new LbryRpcError(-32500, 'wallet password is incorrect', {
    name: 'InvalidPasswordError',
  });
}

function unexpectedRpcCall(method: string) {
  return new LbryRpcError(-32000, `Unexpected LBRY RPC call: ${method}`);
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return {
    promise,
    resolve,
  };
}
