import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { DISABLE_COMMENTS_TAG } from 'constants/tags';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import ChannelDiscussion from './view';
import { makeSelectTagInClaimOrChannelForUri, selectClaimForUri } from 'redux/selectors/claims';
import { selectSettingsByChannelId } from 'redux/selectors/comments';
import { getChannelIdFromClaim } from 'util/claim';

const select = (state, props) => {
  const { search } = props.location;
  const urlParams = new URLSearchParams(search);

  const claim = selectClaimForUri(state, props.uri);
  const channelId = getChannelIdFromClaim(claim);
  const settingsByChannelId = selectSettingsByChannelId(state);
  const channelSettings = channelId ? settingsByChannelId[channelId] : undefined;

  return {
    linkedCommentId: urlParams.get(LINKED_COMMENT_QUERY_PARAM),
    threadCommentId: urlParams.get(THREAD_COMMENT_QUERY_PARAM),
    commentsDisabled: makeSelectTagInClaimOrChannelForUri(props.uri, DISABLE_COMMENTS_TAG)(state),
    commentSettingDisabled: channelSettings && !channelSettings.comments_enabled,
  };
};

export default withRouter(connect(select)(ChannelDiscussion));
