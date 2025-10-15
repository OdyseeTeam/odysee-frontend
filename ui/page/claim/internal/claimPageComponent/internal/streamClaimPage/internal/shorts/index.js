import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { createSelector } from 'reselect';
import * as TAGS from 'constants/tags';
import { getChannelIdFromClaim, createNormalizedClaimSearchKey } from 'util/claim';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';

import {
  selectClaimIsNsfwForUri,
  selectClaimForUri,
  makeSelectTagInClaimOrChannelForUri,
  selectClaimSearchByQuery,
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
import { doClaimSearch } from 'redux/actions/claims';
import { selectIsSearching } from 'redux/selectors/search';
import { selectClientSetting } from 'redux/selectors/settings';
import * as SETTINGS from 'constants/settings';

import ShortsPage from './view';
import {
  selectShortsSidePanelOpen,
  selectShortsPlaylist,
  selectShortsViewMode,
} from '../../../../../../../../redux/selectors/shorts';
import {
  doSetShortsSidePanel,
  doToggleShortsSidePanel,
  doSetShortsPlaylist,
  doSetShortsViewMode,
  doToggleShortsAutoplay,
  doSetShortsAutoplay,
  doClearShortsPlaylist,
} from '../../../../../../../../redux/actions/shorts';
import { toggleAutoplayNextShort } from '../../../../../../../../redux/actions/settings';

const selectShortsRecommendedContent = createSelector(
  [
    selectShortsPlaylist,
    selectShortsViewMode,
    (state, props) => {
      if (!props?.uri) return [];
      const claim = selectClaimForUri(state, props.uri);
      if (!claim?.value?.title) return [];

      const searchResults = state.search.resultsByQuery;
      const titleEncoded = encodeURIComponent(claim.value.title);

      for (const queryKey in searchResults) {
        if (queryKey.includes(`s=${titleEncoded}`) && queryKey.includes('max_aspect_ratio=0.999')) {
          return searchResults[queryKey]?.uris || [];
        }
      }
      return [];
    },
    (state, props) => {
      if (!props?.uri) return [];
      const claim = selectClaimForUri(state, props.uri);
      const channelId = getChannelIdFromClaim(claim);
      if (!channelId) return [];

      const claimSearchByQuery = selectClaimSearchByQuery(state);
      const searchKey = createNormalizedClaimSearchKey({
        channel_ids: [channelId],
        max_duration: 3,
        max_aspect_ratio: 0.999,
        order_by: ['release_time'],
        page_size: 20,
        page: 1,
        claim_type: ['stream'],
        has_source: true,
      });

      return claimSearchByQuery[searchKey] || [];
    },
  ],
  (shortsPlaylist, viewMode, relatedUris, channelUris) => {
    if (shortsPlaylist.length > 0) return shortsPlaylist;
    return viewMode === 'channel' ? channelUris : relatedUris;
  }
);

const select = (state, props) => {
  const { uri, location } = props;
  const urlParams = new URLSearchParams(location.search);
  const claim = selectClaimForUri(state, uri);
  const channelId = getChannelIdFromClaim(claim);
  const claimId = claim?.claim_id;
  const commentSettingDisabled = selectCommentsDisabledSettingForChannelId(state, channelId);
  const shortsRecommendedUris = selectShortsRecommendedContent(state, props);
  const currentIndex = shortsRecommendedUris.findIndex((shortUri) => shortUri === uri);

  const title = claim?.value?.title;
  const channelUri = claim?.signing_channel?.canonical_url || claim?.signing_channel?.permanent_url;
  const thumbnail = claim?.value?.thumbnail?.url || claim?.value?.thumbnail || null;

  console.log(shortsRecommendedUris);

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
    nextRecommendedShort:
      currentIndex >= 0 && currentIndex < shortsRecommendedUris.length - 1
        ? shortsRecommendedUris[currentIndex + 1]
        : null,
    previousRecommendedShort: currentIndex > 0 ? shortsRecommendedUris[currentIndex - 1] : null,
    currentIndex,
    channelId,
    channelName: claim?.signing_channel?.name,
    isSearchingRecommendations: selectIsSearching(state),
    searchInLanguage: selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE),
    viewMode: selectShortsViewMode(state),
    title,
    channelUri,
    thumbnail,
    autoPlayNextShort: selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT_SHORTS),
  };
};

const perform = (dispatch) => ({
  clearPosition: (uri) => dispatch(clearPosition(uri)),
  doNavigateToNextShort: (nextUri) => {
    if (nextUri) {
      window.history.pushState(null, '', nextUri.replace('lbry://', '/').replace(/#/g, ':') + '?view=shorts');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  },
  doNavigateToPreviousShort: (previousUri) => {
    if (previousUri) {
      window.history.pushState(null, '', previousUri.replace('lbry://', '/').replace(/#/g, ':') + '?view=shorts');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  },
  doToggleShortsSidePanel: () => dispatch(doToggleShortsSidePanel()),
  doSetShortsSidePanel: (isOpen) => dispatch(doSetShortsSidePanel(isOpen)),
  doFetchRecommendedContent: (uri, fypParam) => dispatch(doFetchRecommendedContent(uri, fypParam, true)),
  doFetchChannelShorts: (channelId) => {
    return dispatch(
      doClaimSearch({
        channel_ids: [channelId],
        max_duration: 3,
        max_aspect_ratio: 0.999,
        order_by: ['release_time'],
        page_size: 20,
        page: 1,
        claim_type: ['stream'],
        has_source: true,
      })
    );
  },
  doSetShortsPlaylist: (uris) => dispatch(doSetShortsPlaylist(uris)),
  doSetShortsViewMode: (mode) => dispatch(doSetShortsViewMode(mode)),
  doToggleShortsAutoplay: () => dispatch(toggleAutoplayNextShort()),
  doSetShortsAutoplay: (enabled) => dispatch(doSetShortsAutoplay(enabled)),
  doClearShortsPlaylist: () => dispatch(doClearShortsPlaylist()),
});

export default withRouter(connect(select, perform)(ShortsPage));
