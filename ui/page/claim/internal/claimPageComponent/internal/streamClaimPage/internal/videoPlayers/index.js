import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import * as SETTINGS from 'constants/settings';

import { getChannelIdFromClaim } from 'util/claim';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';

import { selectClaimIsNsfwForUri, selectClaimForUri } from 'redux/selectors/claims';
import { makeSelectFileInfoForUri } from 'redux/selectors/file_info';
import { selectClientSetting } from 'redux/selectors/settings';
import {
  selectContentPositionForUri,
  selectPlayingCollectionId,
  selectIsUriCurrentlyPlaying,
  selectIsAutoplayCountdownForUri,
} from 'redux/selectors/content';
import { selectCommentsListTitleForUri, selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';

import { clearPosition } from 'redux/actions/content';

import VideoPlayersPage from './view';

const select = (state, props) => {
  const { uri } = props;
  const { search } = location;

  const urlParams = new URLSearchParams(search);
  const playingCollectionId = selectPlayingCollectionId(state);
  const claim = selectClaimForUri(state, uri);
  const channelId = getChannelIdFromClaim(claim);

  const claimId = claim.claim_id;

  return {
    commentsListTitle: selectCommentsListTitleForUri(state, uri),
    fileInfo: makeSelectFileInfoForUri(uri)(state),
    isMature: selectClaimIsNsfwForUri(state, uri),
    isUriPlaying: selectIsUriCurrentlyPlaying(state, uri),
    linkedCommentId: urlParams.get(LINKED_COMMENT_QUERY_PARAM),
    threadCommentId: urlParams.get(THREAD_COMMENT_QUERY_PARAM),
    playingCollectionId,
    position: selectContentPositionForUri(state, uri),
    commentSettingDisabled: selectCommentsDisabledSettingForChannelId(state, channelId),
    videoTheaterMode: selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE),
    contentUnlocked: claimId && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId),
    isAutoplayCountdownForUri: selectIsAutoplayCountdownForUri(state, uri),
  };
};

const perform = {
  clearPosition,
};

export default withRouter(connect(select, perform)(VideoPlayersPage));
