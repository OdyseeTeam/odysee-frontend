// @flow
import * as ACTIONS from 'constants/action_types';
import Lbry from 'lbry';
import isEqual from 'util/deep-equal';
import { doGetAndPopulatePreferences } from 'redux/actions/app';
import { doPreferenceSet, doUpdateLastSyncHash } from 'redux/actions/sync';
import { selectLastSyncHash } from 'redux/selectors/sync';

const RUN_PREFERENCES_DELAY_MS = 2000;
const SHARED_PREFERENCE_VERSION = '0.1';

let oldShared = {};
let timeout;
let preSyncQueue: Promise<void> = Promise.resolve();

function reportPreSyncError(dispatch, error) {
  console.error('Shared-state pre-sync failed', error); // eslint-disable-line no-console
  dispatch({
    type: ACTIONS.SYNC_FATAL_ERROR,
    error,
  });
}

function getPreferenceMetadata(state) {
  const syncEnabled = state?.settings?.clientSettings?.enable_sync;
  const hasVerifiedEmail = state?.user?.user?.has_verified_email;
  const prefsReady = state?.sync?.prefsReady;

  return {
    preferenceKey: syncEnabled && hasVerifiedEmail && prefsReady ? 'shared' : 'local',
  };
}

function buildSharedState(state, sharedStateFilters) {
  const shared = {};

  Object.keys(sharedStateFilters).forEach((key) => {
    const filter = sharedStateFilters[key];
    const { source, property, transform } = filter;
    let value = state?.[source]?.[property];

    if (transform) {
      value = transform(value);
    }

    shared[key] = value;
  });

  return shared;
}

export const buildSharedStateMiddleware =
  (actions: Array<string>, sharedStateFilters: {}) =>
  ({ getState, dispatch }: { getState: GetState, dispatch: Dispatch }) =>
  (next: ({}) => void) =>
  (action: { type: string, data: any, $isSync?: boolean, [string]: any }) => {
    // We don't care if sync is disabled here, we always want to backup preferences to the wallet
    if (!actions.includes(action.type) || typeof action === 'function') {
      return next(action);
    }
    if (action?.$isSync) {
      // Cross-tab mirrored action: apply state update but do not redo sync side-effects.
      return next(action);
    }

    function applySharedAction(currentAction) {
      clearTimeout(timeout);
      timeout = null;

      const actionResult = next(currentAction);

      // Call `getState` after calling `next` to ensure the state has updated in response to the action
      function runPreferences() {
        const nextState = getState();
        const { preferenceKey: currentPreferenceKey } = getPreferenceMetadata(nextState);
        const shared = buildSharedState(nextState, sharedStateFilters);

        if (!isEqual(oldShared, shared)) {
          // only update if the preference changed from last call in the same session
          oldShared = shared;
          dispatch(doPreferenceSet(currentPreferenceKey, shared, SHARED_PREFERENCE_VERSION));
        }
        clearTimeout(timeout);
        return actionResult;
      }

      timeout = setTimeout(runPreferences, RUN_PREFERENCES_DELAY_MS);
      dispatch({ type: ACTIONS.SHARED_STATE_SYNC_ID_CHANGED, data: timeout });
      return actionResult;
    }

    const hadPendingWrite = timeout != null;
    clearTimeout(timeout);
    timeout = null;

    const state = getState();
    const { preferenceKey } = getPreferenceMetadata(state);
    if (preferenceKey === 'shared') {
      if (hadPendingWrite) {
        // Local state is already ahead of remote; keep building on that state until the debounce flushes.
        return applySharedAction(action);
      }

      preSyncQueue = preSyncQueue
        .catch((error) => {
          reportPreSyncError(dispatch, error);
        })
        .then(async () => {
          const previousSyncHash = selectLastSyncHash(getState());
          let currentSyncHash;
          let shouldPopulatePreferences = previousSyncHash == null;

          try {
            currentSyncHash = await Lbry.sync_hash();
            shouldPopulatePreferences = previousSyncHash == null || currentSyncHash !== previousSyncHash;
          } catch {
            shouldPopulatePreferences = true;
          }

          if (shouldPopulatePreferences) {
            const populated = await Promise.resolve(dispatch(doGetAndPopulatePreferences()))
              .then(() => true)
              .catch(() => false);

            if (populated && currentSyncHash !== undefined) {
              dispatch(doUpdateLastSyncHash(currentSyncHash));
            }
          }

          return applySharedAction(action);
        });

      return preSyncQueue;
    }

    return applySharedAction(action);
  };
