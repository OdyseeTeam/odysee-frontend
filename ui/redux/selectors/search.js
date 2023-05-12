// @flow
import { selectClientSetting, selectLanguage, selectShowMatureContent } from 'redux/selectors/settings';
import {
  selectClaimsByUri,
  selectClaimForClaimId,
  makeSelectClaimForUri,
  makeSelectClaimForClaimId,
  selectClaimIsNsfwForUri,
  makeSelectPendingClaimForUri,
  selectIsUriResolving,
  selectCostInfoForUri,
} from 'redux/selectors/claims';
import { parseURI } from 'util/lbryURI';
import { isClaimNsfw } from 'util/claim';
import { createSelector } from 'reselect';
import { createCachedSelector } from 're-reselect';
import { createNormalizedSearchKey, getRecommendationSearchKey, getRecommendationSearchOptions } from 'util/search';
import { selectMutedChannels } from 'redux/selectors/blocked';
import { selectHistory } from 'redux/selectors/content';
import * as SETTINGS from 'constants/settings';

type State = { claims: any, search: SearchState, user: UserState };

export const selectState = (state: State): SearchState => state.search;

// $FlowFixMe - 'searchQuery' is never populated. Something lost in a merge?
export const selectSearchValue: (state: State) => string = (state) => selectState(state).searchQuery;
export const selectSearchOptions: (state: State) => SearchOptions = (state) => selectState(state).options;
export const selectIsSearching: (state: State) => boolean = (state) => selectState(state).searching;
export const selectSearchResultByQuery = (state: State) => selectState(state).resultsByQuery;
export const selectHasReachedMaxResultsLength: (state: State) => { [boolean]: Array<boolean> } = (state) =>
  selectState(state).hasReachedMaxResultsLength;
export const selectMentionSearchResults: (state: State) => Array<string> = (state) => selectState(state).results;
export const selectMentionQuery: (state: State) => string = (state) => selectState(state).mentionQuery;
export const selectPersonalRecommendations = (state: State) => selectState(state).personalRecommendations;

export const makeSelectSearchUrisForQuery = (query: string): ((state: State) => Array<string>) =>
  createSelector(selectSearchResultByQuery, (byQuery) => {
    if (!query) return;
    // replace statement below is kind of ugly, and repeated in doSearch action
    query = query.replace(/^lbry:\/\//i, '').replace(/\//, ' ');
    const normalizedQuery = createNormalizedSearchKey(query);
    return byQuery[normalizedQuery] && byQuery[normalizedQuery]['uris'];
  });

export const makeSelectHasReachedMaxResultsLength = (query: string): ((state: State) => boolean) =>
  createSelector(selectHasReachedMaxResultsLength, (hasReachedMaxResultsLength) => {
    if (query) {
      query = query.replace(/^lbry:\/\//i, '').replace(/\//, ' ');
      const normalizedQuery = createNormalizedSearchKey(query);
      return hasReachedMaxResultsLength[normalizedQuery];
    }
    return hasReachedMaxResultsLength[query];
  });

export const selectRecommendedContentRawForUri = createCachedSelector(
  (state, uri) => uri,
  selectClaimsByUri,
  selectShowMatureContent,
  selectClaimIsNsfwForUri, // (state, uri)
  selectSearchResultByQuery,
  selectLanguage,
  (state) => selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE),
  (uri, claimsByUri, matureEnabled, isMature, searchUrisByQuery, languageSetting, searchInLanguage) => {
    const claim = claimsByUri[uri];
    const language = searchInLanguage ? languageSetting : null;

    if (claim?.value?.title) {
      const options = getRecommendationSearchOptions(matureEnabled, isMature, claim.claim_id, language);
      const normalizedSearchQuery = getRecommendationSearchKey(claim.value.title, options);
      return searchUrisByQuery[normalizedSearchQuery];
    }

    return undefined;
  }
)((state, uri) => String(uri));

export const selectRecommendedContentForUri = createCachedSelector(
  (state, uri) => uri,
  selectHistory,
  selectRecommendedContentRawForUri, // (state, uri)
  selectClaimsByUri,
  selectMutedChannels,
  selectCostInfoForUri,
  (uri, history, rawRecommendations, claimsByUri, blockedChannels, costInfo) => {
    const claim = claimsByUri[uri];
    if (!claim) {
      return;
    }

    let recommendedContent;
    const currentClaimId = claim.claim_id;
    const searchResult = rawRecommendations;

    if (searchResult) {
      recommendedContent = searchResult['uris'].filter((recUri) => {
        const recClaim = claimsByUri[recUri];

        if (!recClaim) {
          return true;
        }

        const recChannelUri = recClaim?.signing_channel?.canonical_url;
        const isRecChannelBlocked = blockedChannels.some((blockedUri) => blockedUri.includes(recChannelUri));

        let isEqualUri;
        try {
          const { claimId: recClaimId } = parseURI(recUri);
          isEqualUri = recClaimId === currentClaimId;
        } catch (e) {}

        return !isEqualUri && !isRecChannelBlocked;
      });

      for (let i = 0; i < recommendedContent.length; ++i) {
        const nextUri = recommendedContent[i];
        const nextClaim = claimsByUri[nextUri];
        const isVideo = nextClaim?.value?.stream_type === 'video';
        const isAudio = nextClaim?.value?.stream_type === 'audio';

        let watchedBefore = false;
        try {
          const { claimId: nextClaimId } = parseURI(nextUri);
          watchedBefore = history.some((h) => claimsByUri[h.uri]?.claim_id === nextClaimId);
        } catch (e) {}

        if (!watchedBefore && costInfo === 0 && (isVideo || isAudio)) {
          if (i > 0) {
            const top = recommendedContent[0];
            recommendedContent[0] = nextUri;
            recommendedContent[i] = top;
          }
          break;
        }
      }
    }

    return recommendedContent;
  }
)((state, uri) => String(uri));

export const selectNextRecommendedContentForUri = (state: State, uri: string) => {
  const recommendedContent = selectRecommendedContentForUri(state, uri);
  return recommendedContent && recommendedContent[0];
};

export const selectRecommendedMetaForClaimId = createCachedSelector(
  selectClaimForClaimId,
  selectShowMatureContent,
  selectSearchResultByQuery,
  selectLanguage,
  (state) => selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE),
  (claim, matureEnabled, searchUrisByQuery, languageSetting, searchInLanguage) => {
    if (claim && claim?.value?.title && claim.claim_id) {
      const isMature = isClaimNsfw(claim);
      const title = claim.value.title;
      const language = searchInLanguage ? languageSetting : null;

      const options = getRecommendationSearchOptions(matureEnabled, isMature, claim.claim_id, language);
      const normalizedSearchQuery = getRecommendationSearchKey(title, options);

      const searchResult = searchUrisByQuery[normalizedSearchQuery];
      if (searchResult) {
        return {
          poweredBy: searchResult.recsys,
          uuid: searchResult.uuid,
        };
      } else {
        return normalizedSearchQuery;
      }
    }
  }
)((state, claimId) => String(claimId));

export const makeSelectWinningUriForQuery = (query: string) => {
  const uriFromQuery = `lbry://${query}`;

  let channelUriFromQuery = '';
  try {
    const { isChannel } = parseURI(uriFromQuery);
    if (!isChannel) {
      channelUriFromQuery = `lbry://@${query}`;
    }
  } catch (e) {}

  return createSelector(
    selectShowMatureContent,
    makeSelectPendingClaimForUri(uriFromQuery),
    makeSelectClaimForUri(uriFromQuery),
    makeSelectClaimForUri(channelUriFromQuery),
    (matureEnabled, pendingClaim, claim1, claim2) => {
      const claim1Mature = claim1 && isClaimNsfw(claim1);
      const claim2Mature = claim2 && isClaimNsfw(claim2);
      let pendingAmount = pendingClaim && pendingClaim.amount;

      if (!claim1 && !claim2) {
        return undefined;
      } else if (!claim1 && claim2) {
        return matureEnabled ? claim2.canonical_url : claim2Mature ? undefined : claim2.canonical_url;
      } else if (claim1 && !claim2) {
        return matureEnabled
          ? claim1.repost_url || claim1.canonical_url
          : claim1Mature
          ? undefined
          : claim1.repost_url || claim1.canonical_url;
      }

      const effectiveAmount1 = claim1 && (claim1.repost_bid_amount || claim1.meta.effective_amount);
      // claim2 will never have a repost_bid_amount because reposts never start with "@"
      const effectiveAmount2 = claim2 && claim2.meta.effective_amount;

      if (!matureEnabled) {
        if (claim1Mature && !claim2Mature) {
          return claim2.canonical_url;
        } else if (claim2Mature && !claim1Mature) {
          return claim1.repost_url || claim1.canonical_url;
        } else if (claim1Mature && claim2Mature) {
          return undefined;
        }
      }

      const returnBeforePending =
        Number(effectiveAmount1) > Number(effectiveAmount2)
          ? claim1.repost_url || claim1.canonical_url
          : claim2.canonical_url;
      if (pendingAmount && pendingAmount > effectiveAmount1 && pendingAmount > effectiveAmount2) {
        return pendingAmount.permanent_url;
      } else {
        return returnBeforePending;
      }
    }
  );
};

export const selectIsResolvingWinningUri = (state: State, query: string = '') => {
  const uriFromQuery = `lbry://${query}`;
  let channelUriFromQuery;
  try {
    const { isChannel } = parseURI(uriFromQuery);
    if (!isChannel) {
      channelUriFromQuery = `lbry://@${query}`;
    }
  } catch (e) {}

  const claim1IsResolving = selectIsUriResolving(state, uriFromQuery);
  const claim2IsResolving = channelUriFromQuery ? selectIsUriResolving(state, channelUriFromQuery) : false;
  return claim1IsResolving || claim2IsResolving;
};

export const makeSelectUrlForClaimId = (claimId: string) =>
  createSelector(makeSelectClaimForClaimId(claimId), (claim) =>
    claim ? claim.canonical_url || claim.permanent_url : null
  );
