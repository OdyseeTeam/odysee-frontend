import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import ChannelDiscussion from './view';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { getChannelIdFromClaim } from 'util/claim';

const select = (state, props) => {
  const { search } = props.location;
  const urlParams = new URLSearchParams(search);

  const claim = selectClaimForUri(state, props.uri);
  const channelId = getChannelIdFromClaim(claim);

  return {
    linkedCommentId: urlParams.get(LINKED_COMMENT_QUERY_PARAM),
    threadCommentId: urlParams.get(THREAD_COMMENT_QUERY_PARAM),
    commentSettingDisabled: selectCommentsDisabledSettingForChannelId(state, channelId),
  };
};

export default withRouter(connect(select)(ChannelDiscussion));
