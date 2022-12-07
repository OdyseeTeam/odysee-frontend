import { connect } from 'react-redux';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { getChannelIdFromClaim } from 'util/claim';
import CommunityTab from './view';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const channelId = getChannelIdFromClaim(claim);

  return {
    commentSettingDisabled: selectCommentsDisabledSettingForChannelId(state, channelId),
  };
};

export default connect(select)(CommunityTab);
