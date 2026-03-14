import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import * as TAGS from 'constants/tags';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import {
  selectClaimForUri,
  makeSelectTagInClaimOrChannelForUri,
  selectProtectedContentTagForUri,
  selectIsStreamPlaceholderForUri,
} from 'redux/selectors/claims';
import { getChannelIdFromClaim } from 'util/claim';
import { selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';
import { doOpenModal, doCloseAppDrawer } from 'redux/actions/app';
import VideoFullscreenActions from './view';

const select = (state, props) => {
  const { uri, location } = props;
  const { search } = location;
  const urlParams = new URLSearchParams(search);

  const claim = uri && selectClaimForUri(state, uri);
  const claimId = claim?.claim_id;
  const channelId = getChannelIdFromClaim(claim);

  const isProtectedContent = Boolean(selectProtectedContentTagForUri(state, uri));
  const contentUnlocked = claimId && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId);
  const commentSettingDisabled = selectCommentsDisabledSettingForChannelId(state, channelId);

  return {
    accessStatus: !isProtectedContent ? undefined : contentUnlocked ? 'unlocked' : 'locked',
    contentUnlocked,
    commentsDisabled:
      commentSettingDisabled || makeSelectTagInClaimOrChannelForUri(uri, TAGS.DISABLE_COMMENTS_TAG)(state),
    linkedCommentId: urlParams.get(LINKED_COMMENT_QUERY_PARAM),
    threadCommentId: urlParams.get(THREAD_COMMENT_QUERY_PARAM),
    isLivestreamClaim: selectIsStreamPlaceholderForUri(state, uri),
  };
};

const perform = {
  doOpenModal,
  doCloseAppDrawer,
};

export default withRouter(connect(select, perform)(VideoFullscreenActions));
