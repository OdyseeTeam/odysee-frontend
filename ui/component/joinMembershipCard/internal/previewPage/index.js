import { connect } from 'react-redux';
import { selectArweaveTipDataForId, selectCanReceiveFiatTipsForUri } from 'redux/selectors/stripe';
import {
  selectCheapestProtectedContentMembershipForId,
  selectMembershipTiersForChannelUri,
  selectUserHasValidNonCanceledMembershipForCreatorId,
} from 'redux/selectors/memberships';
import { doTipAccountCheckForUri } from 'redux/actions/stripe';
import { selectIsChannelMineForClaimId, selectClaimForUri } from 'redux/selectors/claims';
import { doOpenModal } from 'redux/actions/app';
import PreviewPage from './view';
import { getChannelFromClaim, getChannelTitleFromClaim, getChannelIdFromClaim } from 'util/claim';
import { selectArweaveExchangeRates } from 'redux/selectors/arwallet';

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
    canReceiveFiatTips: selectCanReceiveFiatTipsForUri(state, uri),
    canReceiveArweaveTips: !!selectArweaveTipDataForId(state, channelId),
    creatorMemberships: selectMembershipTiersForChannelUri(state, uri),
    channelIsMine: selectIsChannelMineForClaimId(state, claimId),
    joinEnabled,
    cheapestPlan,
    channelTitle,
    channelUri,
    channelId: claimId,
    channelName: claim.name,
    userHasACreatorMembership: selectUserHasValidNonCanceledMembershipForCreatorId(state, channelId),
    exchangeRate: selectArweaveExchangeRates(state),
  };
};

const perform = (dispatch) => ({
  doTipAccountCheckForUri,
  doOpenModal: (modal, props) => dispatch(doOpenModal(modal, props)),
});

export default connect(select, perform)(PreviewPage);
