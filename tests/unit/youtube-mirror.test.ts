import { beforeAll, describe, expect, it } from 'vite-plus/test';

let filterYouTubeMirrors: any;
let getRecommendationSearchOptions: any;
let isClaimYouTubeMirror: any;
let shouldFetchNextFilteredSearchPage: any;

const makeVideoClaim = (description: string) => ({
  value_type: 'stream',
  value: {
    stream_type: 'video',
    description,
  },
});

beforeAll(async () => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      i18n_messages: {},
      navigator: { language: 'en' },
    },
  });

  const claim = await import('../../ui/util/claim');
  const search = await import('../../ui/util/search');
  filterYouTubeMirrors = claim.filterYouTubeMirrors;
  isClaimYouTubeMirror = claim.isClaimYouTubeMirror;
  getRecommendationSearchOptions = search.getRecommendationSearchOptions;
  shouldFetchNextFilteredSearchPage = search.shouldFetchNextFilteredSearchPage;
});

describe('YouTube mirror filtering', () => {
  const mirrorClaim = makeVideoClaim(
    'This channel is mirrored from YouTube...\nhttps://www.youtube.com/watch?v=video-id_123'
  );

  it('recognizes the canonical Odysee sync description', () => {
    expect(isClaimYouTubeMirror(mirrorClaim)).toBe(true);
  });

  it('recognizes a mirror through a repost wrapper', () => {
    expect(
      isClaimYouTubeMirror({
        value_type: 'repost',
        value: { claim_hash: 'reposted-claim' },
        reposted_claim: mirrorClaim,
      })
    ).toBe(true);
  });

  it('does not hide ordinary descriptions that merely contain a YouTube link', () => {
    const linkedVideo = makeVideoClaim('Watch the source at https://www.youtube.com/watch?v=video-id_123');
    expect(isClaimYouTubeMirror(linkedVideo)).toBe(false);
  });

  it('removes mirrors while retaining placeholders and unresolved claims', () => {
    const nativeClaim = makeVideoClaim('Published directly on Odysee');
    const claimsByUri = {
      'lbry://mirror': mirrorClaim,
      'lbry://native': nativeClaim,
    };

    expect(
      filterYouTubeMirrors(['lbry://mirror', '', 'lbry://native', 'lbry://unresolved'], claimsByUri, true)
    ).toEqual(['', 'lbry://native', 'lbry://unresolved']);
  });
});

describe('recommendation fetch sizing', () => {
  it('uses the same larger result size whenever mirror filtering is enabled', () => {
    expect(getRecommendationSearchOptions(false, false, 'claim-id', null, false).size).toBe(20);
    expect(getRecommendationSearchOptions(false, false, 'claim-id', null, true).size).toBe(50);
  });
});

describe('filtered search pagination', () => {
  const baseState = {
    currentQuery: 'odysee',
    filteredResultCount: 19,
    from: 0,
    hasReachedMaxResultsLength: false,
    hideYouTubeMirrors: true,
    isSearching: false,
    lastCompletedSearchFrom: 0,
    visibleResultTarget: 20,
  };

  it('fetches a replacement page only after the current raw page is loaded', () => {
    expect(shouldFetchNextFilteredSearchPage(baseState)).toBe(true);
    expect(
      shouldFetchNextFilteredSearchPage({
        ...baseState,
        from: 20,
      })
    ).toBe(false);
  });

  it('advances after a completed page even when accumulated results were de-duplicated', () => {
    expect(
      shouldFetchNextFilteredSearchPage({
        ...baseState,
        from: 20,
        lastCompletedSearchFrom: 20,
      })
    ).toBe(true);
  });

  it('stops refilling once the fixed visible target is reached', () => {
    expect(
      shouldFetchNextFilteredSearchPage({
        ...baseState,
        filteredResultCount: 20,
      })
    ).toBe(false);
  });
});
