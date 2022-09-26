import { connect } from 'react-redux';

import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectAccountChargesEnabled } from 'redux/selectors/stripe';
import { selectMyChannelClaims } from 'redux/selectors/claims';

import { doTipAccountStatus } from 'redux/actions/stripe';
import { doListAllMyMembershipTiers } from 'redux/actions/memberships';

import MembershipsPage from './view';

const select = (state, props) => ({
  bankAccountConfirmed: selectAccountChargesEnabled(state),
  activeChannelClaim: selectActiveChannelClaim(state),
  myChannelClaims: selectMyChannelClaims(state),
});

const perform = {
  doTipAccountStatus,
  doListAllMyMembershipTiers,
};

export default connect(select, perform)(MembershipsPage);
