import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import { doFetchAllActiveLivestreamsForQuery } from 'redux/actions/livestream';
import { selectActiveLivestreams, selectIsFetchingActiveLivestreams } from 'redux/selectors/livestream';
import { selectSubscriptions } from 'redux/selectors/subscriptions';
import { selectClientSetting } from 'redux/selectors/settings';

import ChannelsFollowingPage from './view';

const select = (state) => ({
  subscribedChannels: selectSubscriptions(state),
  tileLayout: selectClientSetting(state, SETTINGS.TILE_LAYOUT),
  activeLivestreams: selectActiveLivestreams(state),
  fetchingActiveLivestreams: selectIsFetchingActiveLivestreams(state),
  hideScheduledLivestreams: selectClientSetting(state, SETTINGS.HIDE_SCHEDULED_LIVESTREAMS),
});

export default connect(select, {
  doFetchAllActiveLivestreamsForQuery,
})(ChannelsFollowingPage);
