import { connect } from 'react-redux';
import { selectMutedChannels } from 'redux/selectors/blocked';
import { selectSubscriptions } from 'redux/selectors/subscriptions';
import { selectHomepageData } from 'redux/selectors/settings';
import ChannelsFollowingDiscover from './view';

const select = (state) => ({
  subscribedChannels: selectSubscriptions(state),
  blockedChannels: selectMutedChannels(state),
  homepageData: selectHomepageData(state),
});

export default connect(select)(ChannelsFollowingDiscover);
