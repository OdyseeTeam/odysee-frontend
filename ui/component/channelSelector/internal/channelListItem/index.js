import { connect } from 'react-redux';
import { selectClaimForId } from 'redux/selectors/claims';
import { selectOdyseeMembershipForChannelId } from 'redux/selectors/memberships';
import ChannelListItem from './view';

const select = (state, props) => {
  const { channelId } = props;
  const claim = selectClaimForId(state, channelId);

  return {
    uri: claim?.canonical_url,
    odyseeMembership: selectOdyseeMembershipForChannelId(state, channelId),
  };
};

export default connect(select)(ChannelListItem);
