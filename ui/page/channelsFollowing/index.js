import { connect } from 'react-redux';

import * as SETTINGS from 'constants/settings';

import { selectIsFetchingActiveLivestreams, selectFilteredActiveLivestreamUris } from 'redux/selectors/livestream';
import { selectSubscriptionIds } from 'redux/selectors/subscriptions';
import { selectClientSetting } from 'redux/selectors/settings';

import { doFetchAllActiveLivestreamsForQuery } from 'redux/actions/livestream';

import ChannelsFollowingPage from './view';

const select = (state) => {
  const channelIds = selectSubscriptionIds(state);

  return {
    channelIds,
    tileLayout: selectClientSetting(state, SETTINGS.TILE_LAYOUT),
    fetchingActiveLivestreams: selectIsFetchingActiveLivestreams(state),
    hideScheduledLivestreams: selectClientSetting(state, SETTINGS.HIDE_SCHEDULED_LIVESTREAMS),
    activeLivestreamUris: selectFilteredActiveLivestreamUris(state, channelIds),
  };
};

export default connect(select, {
  doFetchAllActiveLivestreamsForQuery,
})(ChannelsFollowingPage);
