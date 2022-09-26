import { connect } from 'react-redux';

import { selectAccountChargesEnabled } from 'redux/selectors/stripe';
import { selectMyChannelClaims } from 'redux/selectors/claims';
import { userHasMembershipTiers } from 'redux/selectors/memberships';

import TabWrapper from './view';

const select = (state, props) => ({
  myChannelClaims: selectMyChannelClaims(state),
  bankAccountConfirmed: selectAccountChargesEnabled(state),
  hasTiers: userHasMembershipTiers(state),
});

export default connect(select)(TabWrapper);
