import { connect } from 'react-redux';
import { doResolveUris } from 'redux/actions/claims';
import { selectLastActiveSubscriptions, selectSubscriptionUris } from 'redux/selectors/subscriptions';
import ChannelsFollowingManage from './view';

const select = (state) => ({
  subscribedChannelUris: selectSubscriptionUris(state),
  lastActiveSubs: selectLastActiveSubscriptions(state),
});

const perform = {
  doResolveUris,
};

export default connect(select, perform)(ChannelsFollowingManage);
