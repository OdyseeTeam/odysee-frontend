import { connect } from 'react-redux';
// withRouter removed in React Router v7
import * as TAGS from 'constants/tags';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import {
  selectClaimForUri,
  makeSelectTagInClaimOrChannelForUri,
  selectProtectedContentTagForUri,
} from 'redux/selectors/claims';
import { getChannelIdFromClaim } from 'util/claim';
import { selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';
import { selectPlayingCollectionId } from 'redux/selectors/content';
import { selectMyReactionForUri } from 'redux/selectors/reactions';
import { doOpenModal } from 'redux/actions/app';
const doCloseAppDrawer = () => () => {}; // stub — not exported from app.ts
import { doReactionLike, doReactionDislike } from 'redux/actions/reactions';
import VideoFullscreenActions from './view';

const select = (state, props) => {
  const { uri } = props;
  const search = window.location.search || '';
  const urlParams = new URLSearchParams(search);

  const claim = uri && selectClaimForUri(state, uri);
  const claimId = claim?.claim_id;
  const channelId = getChannelIdFromClaim(claim);

  const isProtectedContent = Boolean(selectProtectedContentTagForUri(state, uri));
  const contentUnlocked = claimId && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId);
  const commentSettingDisabled = selectCommentsDisabledSettingForChannelId(state, channelId);

  const description = claim?.value?.description;

  return {
    accessStatus: !isProtectedContent ? undefined : contentUnlocked ? 'unlocked' : 'locked',
    contentUnlocked,
    commentsDisabled:
      commentSettingDisabled || makeSelectTagInClaimOrChannelForUri(uri, TAGS.DISABLE_COMMENTS_TAG)(state),
    linkedCommentId: urlParams.get(LINKED_COMMENT_QUERY_PARAM),
    threadCommentId: urlParams.get(THREAD_COMMENT_QUERY_PARAM),
    description,
    playingCollectionId: selectPlayingCollectionId(state),
    myReaction: selectMyReactionForUri(state, uri),
  };
};

const perform = {
  doOpenModal,
  doCloseAppDrawer,
  doReactionLike,
  doReactionDislike,
};

export default connect(select, perform)(VideoFullscreenActions);
