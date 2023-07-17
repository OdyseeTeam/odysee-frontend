import { connect } from 'react-redux';
import { selectHasChannels, selectFetchingMyChannels } from 'redux/selectors/claims';
import { doClearPublish } from 'redux/actions/publish';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { doFetchNoSourceClaimsForChannelId } from 'redux/actions/claims';
import { selectUser } from 'redux/selectors/user';
import {
  makeSelectPendingLivestreamsForChannelId,
  makeSelectLivestreamsForChannelId,
} from 'redux/selectors/livestream';
import { selectBalance } from 'redux/selectors/wallet';
import { selectPublishFormValues } from 'redux/selectors/publish';
import LivestreamSetupPage from './view';

const select = (state) => {
  const activeChannelClaim = selectActiveChannelClaim(state);
  const { claim_id: channelId, name: channelName } = activeChannelClaim || {};
  return {
    ...selectPublishFormValues(state),
    channelName,
    channelId,
    hasChannels: selectHasChannels(state),
    fetchingChannels: selectFetchingMyChannels(state),
    activeChannelClaim,
    myLivestreamClaims: makeSelectLivestreamsForChannelId(channelId)(state),
    pendingClaims: makeSelectPendingLivestreamsForChannelId(channelId)(state),
    user: selectUser(state),
    balance: selectBalance(state),
  };
};
const perform = (dispatch) => ({
  clearPublish: () => dispatch(doClearPublish()),
  doNewLivestream: (path) => {
    dispatch(doClearPublish());
  },
  fetchNoSourceClaims: (id) => dispatch(doFetchNoSourceClaimsForChannelId(id)),
});
export default connect(select, perform)(LivestreamSetupPage);
