import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { selectAccountChargesEnabled } from 'redux/selectors/stripe';
import { selectMembershipTiersForCreatorId, selectMembershipOdyseePermanentPerks } from 'redux/selectors/memberships';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { doGetMembershipPerks, doDeactivateMembershipForId } from 'redux/actions/memberships';
import { doToast } from 'redux/actions/notifications';
import TiersTab from './view';
import { selectArweaveExchangeRates } from 'redux/selectors/arwallet';

const select = (state, props) => {
  const activeChannelClaim = selectActiveChannelClaim(state);

  return {
    bankAccountConfirmed: selectAccountChargesEnabled(state),
    channelMemberships: activeChannelClaim && selectMembershipTiersForCreatorId(state, activeChannelClaim.claim_id), //
    activeChannelClaim,
    membershipOdyseePermanentPerks: selectMembershipOdyseePermanentPerks(state),
    exchangeRate: selectArweaveExchangeRates(state),
  };
};

const perform = {
  doOpenModal,
  doGetMembershipPerks,
  doDeactivateMembershipForId,
  doToast,
};

export default connect(select, perform)(TiersTab);
