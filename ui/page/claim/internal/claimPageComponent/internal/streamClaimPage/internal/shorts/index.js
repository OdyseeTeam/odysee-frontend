import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { createSelector } from 'reselect';
import * as TAGS from 'constants/tags';
import { getChannelIdFromClaim } from 'util/claim';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';

import {
  selectClaimIsNsfwForUri,
  selectClaimForUri,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { makeSelectFileInfoForUri } from 'redux/selectors/file_info';
import {
  selectContentPositionForUri,
  selectPlayingCollectionId,
  selectIsUriCurrentlyPlaying,
  selectIsAutoplayCountdownForUri,
} from 'redux/selectors/content';
import { selectCommentsListTitleForUri, selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';
import { clearPosition } from 'redux/actions/content';
import { doFetchRecommendedContent } from 'redux/actions/search';
import { selectIsSearching, selectRecommendedMetaForClaimId } from 'redux/selectors/search';
import { selectClientSetting } from 'redux/selectors/settings';
import * as SETTINGS from 'constants/settings';

import ShortsPage from './view';
import { selectShortsSidePanelOpen, selectShortsPlaylist } from '../../../../../../../../redux/selectors/shorts';
import {
  doSetShortsSidePanel,
  doToggleShortsSidePanel,
  doSetShortsPlaylist,
} from '../../../../../../../../redux/actions/shorts';

// Updated selector to get shorts playlist from Redux state, but fall back to search results if needed
const selectShortsRecommendedContent = createSelector(
  [
    selectShortsPlaylist,
    (state, props) => {
      // Safety check for props
      if (!props || !props.uri) return [];

      // Fallback: try to get from search results if playlist is empty
      const claim = selectClaimForUri(state, props.uri);
      if (!claim || !claim.value || !claim.value.title) return [];
      const shortsQuery = `shorts:${claim.value.title}`;
      const searchResults = state.search.resultsByQuery;
      for (const queryKey in searchResults) {
        const decodedQuery = decodeURIComponent(queryKey);
        if (decodedQuery.startsWith(`s=${shortsQuery}`) || decodedQuery.startsWith(`s="${shortsQuery}"`)) {
          const result = searchResults[queryKey];
          return result && result.uris ? result.uris : [];
        }
      }

      return [];
    },
  ],
  (shortsPlaylist, searchUris) => {
    // Return playlist if it exists, otherwise return search results
    return shortsPlaylist.length > 0 ? shortsPlaylist : searchUris;
  }
);

const select = (state, props) => {
  const { uri, location } = props;
  const { search } = location;

  const urlParams = new URLSearchParams(search);
  const claim = selectClaimForUri(state, uri);
  const channelId = getChannelIdFromClaim(claim);
  const claimId = claim?.claim_id;

  const commentSettingDisabled = selectCommentsDisabledSettingForChannelId(state, channelId);

  const shortsRecommendedUris = selectShortsRecommendedContent(state, { uri });

  console.log(shortsRecommendedUris);

  // Find current index in the shorts playlist
  const currentIndex = shortsRecommendedUris.findIndex((shortUri) => shortUri === uri);

  // Determine next and previous videos
  const nextRecommendedShort =
    currentIndex >= 0 && currentIndex < shortsRecommendedUris.length - 1
      ? shortsRecommendedUris[currentIndex + 1]
      : null;

  const previousRecommendedShort = currentIndex > 0 ? shortsRecommendedUris[currentIndex - 1] : null;

  return {
    commentsListTitle: selectCommentsListTitleForUri(state, uri),
    fileInfo: makeSelectFileInfoForUri(uri)(state),
    isMature: selectClaimIsNsfwForUri(state, uri),
    isUriPlaying: selectIsUriCurrentlyPlaying(state, uri),
    linkedCommentId: urlParams.get(LINKED_COMMENT_QUERY_PARAM),
    threadCommentId: urlParams.get(THREAD_COMMENT_QUERY_PARAM),
    playingCollectionId: selectPlayingCollectionId(state),
    position: selectContentPositionForUri(state, uri),
    commentsDisabled:
      commentSettingDisabled || makeSelectTagInClaimOrChannelForUri(uri, TAGS.DISABLE_COMMENTS_TAG)(state),
    contentUnlocked: claimId && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId),
    isAutoplayCountdownForUri: selectIsAutoplayCountdownForUri(state, uri),
    sidePanelOpen: selectShortsSidePanelOpen(state),
    shortsRecommendedUris,
    nextRecommendedShort,
    previousRecommendedShort,
    currentIndex,
    isSearchingRecommendations: selectIsSearching(state),
    searchInLanguage: selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE),
    recommendedMetadata: claimId ? selectRecommendedMetaForClaimId(state, claimId) : null,
  };
};

const perform = (dispatch, ownProps) => ({
  clearPosition: (uri) => dispatch(clearPosition(uri)),
  doNavigateToNextShort: (nextUri) => {
    if (nextUri) {
      const webPath = nextUri.replace('lbry://', '/').replace(/#/g, ':') + '?view=shorts';
      ownProps.history.push(webPath);
    }
  },
  doNavigateToPreviousShort: (previousUri) => {
    if (previousUri) {
      const webPath = previousUri.replace('lbry://', '/').replace(/#/g, ':') + '?view=shorts';
      ownProps.history.push(webPath);
    }
  },
  doToggleShortsSidePanel: () => dispatch(doToggleShortsSidePanel()),
  doSetShortsSidePanel: (isOpen) => dispatch(doSetShortsSidePanel(isOpen)),
  doFetchRecommendedContent: (uri, fypParam, isShorts = true) =>
    dispatch(doFetchRecommendedContent(uri, fypParam, isShorts)),
  doSetShortsPlaylist: (uris) => dispatch(doSetShortsPlaylist(uris)),
});

export default withRouter(connect(select, perform)(ShortsPage));
