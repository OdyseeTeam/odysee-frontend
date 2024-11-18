import { connect } from 'react-redux';
import {
  selectMyChannelClaimUrls,
  selectMyChannelClaimIds,
  selectFetchingMyChannels,
  selectClaimsByUri,
} from 'redux/selectors/claims';
import { doFetchOdyseeMembershipForChannelIds } from 'redux/actions/memberships';
import { doUserViewRateList } from 'redux/actions/rewards';
import { doFetchChannelListMine } from 'redux/actions/claims';
import { doSetActiveChannel } from 'redux/actions/app';
import { selectHasYoutubeChannels } from 'redux/selectors/user';

import ChannelsPage from './view';

const select = (state) => ({
  channelUrls: selectMyChannelClaimUrls(state),
  channelIds: selectMyChannelClaimIds(state),
  fetchingChannels: selectFetchingMyChannels(state),
  hasYoutubeChannels: selectHasYoutubeChannels(state),
  claimsByUri: selectClaimsByUri(state),
});

const perform = {
  doFetchChannelListMine,
  doSetActiveChannel,
  doFetchOdyseeMembershipForChannelIds,
  doUserViewRateList,
};

export default connect(select, perform)(ChannelsPage);
