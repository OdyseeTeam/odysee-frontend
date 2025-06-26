import { connect } from 'react-redux';
import { selectArweaveTipDataForId, selectCanReceiveFiatTipsForUri, selectFullAPIArweaveAccounts } from 'redux/selectors/stripe';
import {
  selectCheapestProtectedContentMembershipForId, selectIsMembershipListFetchingForId,
  selectArEnabledMembershipTiersForChannelUri,
  selectUserHasValidNonCanceledMembershipForCreatorId,
} from 'redux/selectors/memberships';
import { doTipAccountCheckForUri } from 'redux/actions/stripe';
import { selectIsChannelMineForClaimId, selectClaimForUri } from 'redux/selectors/claims';
import { doOpenModal } from 'redux/actions/app';
import PreviewPage from './view';
import { getChannelFromClaim, getChannelTitleFromClaim, getChannelIdFromClaim } from 'util/claim';
import { selectArweaveStatus } from 'redux/selectors/arwallet';

const select = (state, props) => {
  const { uri } = props;
  const { claim_id: claimId } = selectClaimForUri(state, props.uri) || {};
  const claim = selectClaimForUri(state, props.uri);

  const channelTitle = getChannelTitleFromClaim(claim);
  const channelId = getChannelIdFromClaim(claim);

  const { canonical_url: channelUri } = getChannelFromClaim(claim) || {};
  const cheapestPlan = selectCheapestProtectedContentMembershipForId(state, claimId);
  const joinEnabled = cheapestPlan && cheapestPlan.prices.some(p => p.address);

  return {
    paymentsEnabled: selectArweaveTipDataForId(state, channelId),
    canReceiveFiatTips: selectCanReceiveFiatTipsForUri(state, uri),
    canReceiveArweaveTips: !!selectArweaveTipDataForId(state, channelId),
    creatorMemberships: selectArEnabledMembershipTiersForChannelUri(state, uri),
    channelIsMine: selectIsChannelMineForClaimId(state, claimId),
    isFetchingMemberships: selectIsMembershipListFetchingForId(state, claimId),
    joinEnabled,
    cheapestPlan,
    channelTitle,
    channelUri,
    channelId: claimId,
    channelName: claim?.name,
    userHasACreatorMembership: selectUserHasValidNonCanceledMembershipForCreatorId(state, channelId),
    arweaveWallets: selectFullAPIArweaveAccounts(state),
    arweaveStatus: selectArweaveStatus(state),
  };
};

const perform = (dispatch) => ({
  doTipAccountCheckForUri,
  doOpenModal: (modal, props) => dispatch(doOpenModal(modal, props)),
});

export default connect(select, perform)(PreviewPage);
