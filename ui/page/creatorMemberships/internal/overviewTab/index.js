import { connect } from 'react-redux';
import { selectAccountChargesEnabled } from 'redux/selectors/stripe';
import { selectMyMembershipTiers } from 'redux/selectors/memberships';
import { selectActiveChannelClaim } from 'redux/selectors/app';

import { doSetActiveChannel } from 'redux/actions/app';
import OverviewTab from './view';

const select = (state, props) => {
  const activeChannel = selectActiveChannelClaim(state);
  const myMembershipTiers = selectMyMembershipTiers(state, activeChannel?.claim_id);

  return {
    hasTiers: myMembershipTiers?.length,
    bankAccountConfirmed: selectAccountChargesEnabled(state),
  };
};

const perform = {
  doSetActiveChannel,
};

export default connect(select, perform)(OverviewTab);
