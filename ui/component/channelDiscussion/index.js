import { connect } from 'react-redux';
import ChannelDiscussion from './view';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { getChannelIdFromClaim } from 'util/claim';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const channelId = getChannelIdFromClaim(claim);

  return {
    commentSettingDisabled: selectCommentsDisabledSettingForChannelId(state, channelId),
  };
};

export default connect(select)(ChannelDiscussion);
