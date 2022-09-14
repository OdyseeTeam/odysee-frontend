import { connect } from 'react-redux';
import MembershipsPage from './view';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectAccountChargesEnabled } from 'redux/selectors/stripe';
import { doTipAccountStatus } from 'redux/actions/stripe';
import { selectMyChannelClaims } from 'redux/selectors/claims';
import { userHasMembershipTiers } from 'redux/selectors/memberships';
import { doListAllMyMembershipTiers } from 'redux/actions/memberships';

const select = (state, props) => ({
  hasTiers: userHasMembershipTiers(state),
  bankAccountConfirmed: selectAccountChargesEnabled(state),
  activeChannelClaim: selectActiveChannelClaim(state),
  myChannelClaims: selectMyChannelClaims(state),
});

const perform = {
  doTipAccountStatus,
  doListAllMyMembershipTiers,
};

export default connect(select, perform)(MembershipsPage);
