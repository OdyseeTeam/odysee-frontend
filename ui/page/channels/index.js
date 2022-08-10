import { connect } from 'react-redux';
import {
  selectMyChannelClaimUrls,
  selectMyChannelClaimIds,
  selectFetchingMyChannels,
  selectPendingIds,
} from 'redux/selectors/claims';
import { doFetchOdyseeMembershipForChannelIds } from 'redux/actions/memberships';
import { doFetchChannelListMine } from 'redux/actions/claims';
import { doSetActiveChannel } from 'redux/actions/app';
import { selectYoutubeChannels } from 'redux/selectors/user';
import ChannelsPage from './view';

const select = (state) => ({
  channelUrls: selectMyChannelClaimUrls(state),
  channelIds: selectMyChannelClaimIds(state),
  fetchingChannels: selectFetchingMyChannels(state),
  youtubeChannels: selectYoutubeChannels(state),
  pendingIds: selectPendingIds(state),
});

const perform = {
  doFetchChannelListMine,
  doSetActiveChannel,
  doFetchOdyseeMembershipForChannelIds,
};

export default connect(select, perform)(ChannelsPage);
