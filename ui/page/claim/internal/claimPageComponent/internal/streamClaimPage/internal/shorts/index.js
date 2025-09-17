import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { createSelector } from 'reselect';
import * as TAGS from 'constants/tags';
import { getChannelIdFromClaim, isClaimShort } from 'util/claim';
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
import {
  selectRecommendedContentForUri,
  selectIsSearching,
  selectRecommendedMetaForClaimId,
} from 'redux/selectors/search';
import { selectClientSetting } from 'redux/selectors/settings';
import * as SETTINGS from 'constants/settings';

import ShortsPage from './view';
import { selectShortsSidePanelOpen } from '../../../../../../../../redux/selectors/shorts';
import { doSetShortsSidePanel, doToggleShortsSidePanel } from '../../../../../../../../redux/actions/shorts';

const selectShortsRecommendedContent = createSelector(
  (state, props) => selectRecommendedContentForUri(state, props.uri),
  (state) => state.claims && state.claims.byUri,
  (recommendedUris, claimsByUri) => {
    if (!recommendedUris || !claimsByUri) return [];

    const filtered = recommendedUris.filter((uri) => {
      if (!uri || !claimsByUri) return false;

      const claim = claimsByUri[uri];
      if (!claim || !claim.value) return false;

      const { stream_type, video, audio } = claim.value || {};
      if (stream_type !== 'video' && !video) {
        return false;
      }
      if (typeof isClaimShort === 'function') {
        const isShort = isClaimShort(claim);
        if (!isShort) {
          return false;
        }
      }

      return true;
    });
    return filtered;
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

  const allRecommendedUris = selectRecommendedContentForUri(state, uri);
  const shortsRecommendedUris = selectShortsRecommendedContent(state, props);

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
    allRecommendedUris,
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
});

export default withRouter(connect(select, perform)(ShortsPage));
