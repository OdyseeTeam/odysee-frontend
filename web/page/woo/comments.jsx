// @flow
import { connect } from 'react-redux';
import CommentsListView from 'component/commentsList/view';
import { doCommentById, doCommentReactList, doCommentReset, doCommentListForId } from 'redux/actions/comments';
import { selectCommentsById } from 'redux/selectors/comments';

type OwnProps = {|
  claimId: string,
  uri: string,
|};

const select = (state, props: OwnProps) => {
  const { claimId } = props;
  const commentsState = state.comments;

  const byIdMap = commentsState.byId || {};
  const topLevelById = commentsState.topLevelCommentsById || {};
  const commentById = selectCommentsById(state) || {};

  const allCommentIds = byIdMap[claimId] || [];
  const topLevelIds = topLevelById[claimId] || [];
  const topLevelComments = topLevelIds.map((cid) => commentById[cid]).filter(Boolean);
  const pinnedIds = (commentsState.pinnedCommentsById && commentsState.pinnedCommentsById[claimId]) || [];
  const pinnedComments = pinnedIds.map((cid) => commentById[cid]).filter(Boolean);

  return {
    // Minimal mapping needed by CommentsListView
    allCommentIds,
    topLevelComments,
    topLevelTotalPages: commentsState.topLevelTotalPagesById[claimId] || 0,
    totalComments: commentsState.topLevelTotalCommentsById[claimId] || commentsState.totalCommentsById[claimId] || 0,
    pinnedComments,

    // Flags
    isFetchingComments: commentsState.isLoading,
    isFetchingTopLevelComments:
      commentsState.isLoading && Object.keys(commentsState.isLoadingByParentId || {}).length === 0,
    isFetchingReacts: commentsState.isFetchingReacts,

    // Unused/neutral defaults for external content
    claimId,
    channelId: undefined,
    claimIsMine: false,
    fetchingChannels: false,
    isAChannelMember: false,
    commentsEnabledSetting: true,
    linkedCommentAncestors: undefined,
    threadComment: undefined,
    threadCommentAncestors: undefined,
    scheduledState: undefined,
  };
};

const perform = (dispatch, ownProps: OwnProps) => ({
  fetchTopLevelComments: (uri, parentId, page, pageSize, sortBy) =>
    dispatch(doCommentListForId(ownProps.claimId, parentId, page, pageSize, sortBy)),
  fetchComment: (id) => dispatch(doCommentById(id)),
  fetchReacts: (ids) => dispatch(doCommentReactList(ids)),
  resetComments: () => dispatch(doCommentReset(ownProps.claimId)),
});

export default connect<any, OwnProps, _, _, _, _>(select, perform)(CommentsListView);
