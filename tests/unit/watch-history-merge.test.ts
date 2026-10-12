import { describe, expect, it } from 'vite-plus/test';
import * as ACTIONS from '../../ui/constants/action_types';
import contentReducer from '../../ui/redux/reducers/content';

function initialState() {
  return contentReducer(undefined, { type: '@@INIT' });
}

function completed(remoteHistory: Array<{ uri: string; lastViewed: number }>, remotePositions = {}, fetchedAt = 1000) {
  return { type: ACTIONS.FETCH_VIEW_HISTORY_COMPLETED, data: { remoteHistory, remotePositions, fetchedAt } };
}

function viewed(uri: string, lastViewed: number) {
  return { type: ACTIONS.SET_CONTENT_LAST_VIEWED, data: { uri, lastViewed } };
}

function positioned(claimId: string, outpoint: string, position: number) {
  return { type: ACTIONS.SET_CONTENT_POSITION, data: { claimId, outpoint, position } };
}

describe('remote watch history merge', () => {
  it('restores history when local storage was lost', () => {
    const state = contentReducer(
      initialState(),
      completed([
        { uri: 'lbry://@a#1/older#1', lastViewed: 100 },
        { uri: 'lbry://@a#1/newer#2', lastViewed: 200 },
      ])
    );

    expect(state.history).toEqual([
      { uri: 'lbry://@a#1/newer#2', lastViewed: 200 },
      { uri: 'lbry://@a#1/older#1', lastViewed: 100 },
    ]);
  });

  it('keeps local entries and takes the newer remote timestamp', () => {
    let state = contentReducer(initialState(), viewed('lbry://@a#1/both#1', 100));
    state = contentReducer(state, completed([{ uri: 'lbry://@a#1/both#1', lastViewed: 300 }]));

    expect(state.history).toEqual([{ uri: 'lbry://@a#1/both#1', lastViewed: 300 }]);
  });

  it('merges a uri repeated in the remote list once, using its newest timestamp', () => {
    const state = contentReducer(
      initialState(),
      completed([
        { uri: 'lbry://@a#1/dup#1', lastViewed: 500 },
        { uri: 'lbry://@a#1/dup#1', lastViewed: 50 },
      ])
    );

    expect(state.history).toEqual([{ uri: 'lbry://@a#1/dup#1', lastViewed: 500 }]);
  });

  it('records the fetch time carried on the action', () => {
    let state = contentReducer(initialState(), { type: ACTIONS.FETCH_VIEW_HISTORY_STARTED });
    expect(state.fetchingRemoteHistory).toBe(true);

    state = contentReducer(state, completed([], {}, 4242));
    expect(state.fetchingRemoteHistory).toBe(false);
    expect(state.remoteHistoryLastFetched).toBe(4242);
  });

  it('stops fetching on failure', () => {
    let state = contentReducer(initialState(), { type: ACTIONS.FETCH_VIEW_HISTORY_STARTED });
    state = contentReducer(state, { type: ACTIONS.FETCH_VIEW_HISTORY_FAILED });

    expect(state.fetchingRemoteHistory).toBe(false);
  });
});

describe('remote resume positions', () => {
  it('fills in positions for claims with none and ignores zero', () => {
    const state = contentReducer(initialState(), completed([], { watched: 42, finished: 0 }));

    expect(state.positions).toEqual({ watched: { remote: 42 } });
  });

  it('refreshes a remote-only position on later syncs', () => {
    let state = contentReducer(initialState(), completed([], { claim: 10 }));
    state = contentReducer(state, completed([], { claim: 60 }));

    expect(state.positions.claim).toEqual({ remote: 60 });
  });

  it('never overrides or sits beside a local position', () => {
    let state = contentReducer(initialState(), positioned('claim', 'txid:0', 5));
    state = contentReducer(state, completed([], { claim: 99 }));

    expect(state.positions.claim).toEqual({ 'txid:0': 5 });
  });
});
