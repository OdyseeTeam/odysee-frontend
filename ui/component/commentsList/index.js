import { connect } from 'react-redux';
import {
  selectClaimForUri,
  selectClaimIsMine,
  selectFetchingMyChannels,
  selectClaimsByUri,
} from 'redux/selectors/claims';
import {
  selectTopLevelCommentsForUri,
  makeSelectTopLevelTotalPagesForUri,
  selectIsFetchingComments,
  selectIsFetchingCommentsById,
  selectIsFetchingReacts,
  selectTotalCommentsCountForUri,
  selectOthersReacts,
  selectMyReacts,
  selectCommentIdsForUri,
  selectSettingsByChannelId,
  selectPinnedCommentsForUri,
  selectCommentForCommentId,
  selectCommentAncestorsForId,
} from 'redux/selectors/comments';
import { doCommentReset, doCommentList, doCommentById, doCommentReactList } from 'redux/actions/comments';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { didFetchById } from 'redux/selectors/user';
import { getChannelIdFromClaim } from 'util/claim';
import { doFetchOdyseeMembershipsById, doFetchChannelMembershipsByIds } from 'redux/actions/memberships';
import CommentsList from './view';

const select = (state, props) => {
  const { uri, threadCommentId, linkedCommentId } = props;

  const claim = selectClaimForUri(state, uri);
  const activeChannelClaim = selectActiveChannelClaim(state);
  const threadComment = selectCommentForCommentId(state, threadCommentId);
  const activeChannelId = activeChannelClaim && activeChannelClaim.claim_id;

  return {
    topLevelComments: threadComment ? [threadComment] : selectTopLevelCommentsForUri(state, uri),
    threadComment,
    allCommentIds: selectCommentIdsForUri(state, uri),
    pinnedComments: selectPinnedCommentsForUri(state, uri),
    topLevelTotalPages: makeSelectTopLevelTotalPagesForUri(uri)(state),
    totalComments: selectTotalCommentsCountForUri(state, uri),
    claimId: claim && claim.claim_id,
    channelId: getChannelIdFromClaim(claim),
    claimIsMine: selectClaimIsMine(state, claim),
    isFetchingComments: selectIsFetchingComments(state),
    isFetchingCommentsById: selectIsFetchingCommentsById(state),
    isFetchingReacts: selectIsFetchingReacts(state),
    fetchingChannels: selectFetchingMyChannels(state),
    settingsByChannelId: selectSettingsByChannelId(state),
    myReactsByCommentId: selectMyReacts(state),
    othersReactsById: selectOthersReacts(state),
    activeChannelId,
    claimsByUri: selectClaimsByUri(state),
    threadCommentAncestors: selectCommentAncestorsForId(state, threadCommentId),
    linkedCommentAncestors: selectCommentAncestorsForId(state, linkedCommentId),
    didFetchById: claim && didFetchById(state, getChannelIdFromClaim(claim)),
  };
};

const perform = {
  fetchTopLevelComments: doCommentList,
  fetchComment: doCommentById,
  fetchReacts: doCommentReactList,
  resetComments: doCommentReset,
  doFetchOdyseeMembershipsById,
  doFetchChannelMembershipsByIds,
};

export default connect(select, perform)(CommentsList);
