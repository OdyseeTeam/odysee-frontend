import { beforeAll, describe, expect, it } from 'vite-plus/test';

let ACTIONS: any;
let commentsReducer: any;

const CLAIM_ID = 'claim1';

const comment = (commentId: string, isPinned: boolean) => ({
  comment_id: commentId,
  claim_id: CLAIM_ID,
  channel_id: `channel-${commentId}`,
  channel_url: `lbry://@${commentId}#1`,
  is_pinned: isPinned,
});

const completePage = (state: any, page: number, totalPages: number, comments: Array<any>) =>
  commentsReducer(state, {
    type: ACTIONS.COMMENT_LIST_COMPLETED,
    data: {
      comments,
      totalItems: 11,
      totalFilteredItems: 11,
      totalPages,
      claimId: CLAIM_ID,
      page,
    },
  });

beforeAll(async () => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { i18n_messages: {}, navigator: { language: 'en' } },
  });

  ACTIONS = await import('../../ui/constants/action_types');
  commentsReducer = (await import('../../ui/redux/reducers/comments')).default;
});

describe('top-level comment pagination', () => {
  it('advances past a page containing only pinned comments', () => {
    const pinnedComments = Array.from({ length: 10 }, (_, index) => comment(`pinned-${index}`, true));
    const firstPage = completePage(undefined, 1, 2, pinnedComments);

    expect(firstPage.topLevelCommentsById[CLAIM_ID]).toEqual([]);
    expect(firstPage.pinnedCommentsById[CLAIM_ID]).toHaveLength(10);
    expect(firstPage.lastFetchedTopLevelPageById[CLAIM_ID]).toBe(1);

    const secondPage = completePage(firstPage, 2, 1, [comment('regular', false)]);

    expect(secondPage.topLevelCommentsById[CLAIM_ID]).toEqual(['regular']);
    expect(secondPage.lastFetchedTopLevelPageById[CLAIM_ID]).toBe(2);
    expect(secondPage.topLevelTotalPagesById[CLAIM_ID]).toBe(2);
  });

  it('clears fetched-page state when comments are reset', () => {
    const firstPage = completePage(undefined, 1, 2, [comment('regular', false)]);
    const resetState = commentsReducer(firstPage, {
      type: ACTIONS.COMMENT_LIST_RESET,
      data: { claimId: CLAIM_ID },
    });

    expect(resetState.lastFetchedTopLevelPageById[CLAIM_ID]).toBeUndefined();
  });
});
