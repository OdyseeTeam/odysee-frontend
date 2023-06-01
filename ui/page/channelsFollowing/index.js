import { connect } from 'react-redux';

import * as SETTINGS from 'constants/settings';

import {
  selectIsFetchingActiveLivestreams,
  selectActiveLivestreamByCreatorId,
  selectViewersById,
} from 'redux/selectors/livestream';
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
    activeLivestreamByCreatorId: selectActiveLivestreamByCreatorId(state),
    livestreamViewersById: selectViewersById(state),
  };
};

export default connect(select, {
  doFetchAllActiveLivestreamsForQuery,
})(ChannelsFollowingPage);
