import { connect } from 'react-redux';
import SelectChannel from './view';
import { selectMyChannelClaimsList, selectFetchingMyChannels } from 'redux/selectors/claims';
import { selectActiveChannelClaimId } from 'redux/selectors/app';
import { doSetActiveChannel } from 'redux/actions/app';

const select = (state) => ({
  myChannelClaimIds: selectMyChannelClaimsList(state),
  fetchingChannels: selectFetchingMyChannels(state),
  activeChannelClaimId: selectActiveChannelClaimId(state),
});

const perform = {
  setActiveChannel: doSetActiveChannel,
};

export default connect(select, perform)(SelectChannel);
