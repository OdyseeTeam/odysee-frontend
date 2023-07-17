import { connect } from 'react-redux';
import { selectSubscriptionIds } from 'redux/selectors/subscriptions';
import { selectHomepageData, selectHomepageDiscover } from 'redux/selectors/settings';
import ChannelsFollowingDiscover from './view';

const select = (state) => ({
  subscribedChannelIds: selectSubscriptionIds(state),
  homepageData: selectHomepageData(state) || {},
  discoverData: selectHomepageDiscover(state),
});

export default connect(select)(ChannelsFollowingDiscover);
