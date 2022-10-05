import { connect } from 'react-redux';

import { selectAccountChargesEnabled } from 'redux/selectors/stripe';
import { selectMyChannelClaims } from 'redux/selectors/claims';
import {
  userHasMembershipTiers,
  selectMySupportersList,
  selectUserHasValidOdyseeMembership,
} from 'redux/selectors/memberships';
import { selectUserExperimentalUi } from 'redux/selectors/user';

import TabWrapper from './view';

const select = (state, props) => ({
  myChannelClaims: selectMyChannelClaims(state),
  bankAccountConfirmed: selectAccountChargesEnabled(state),
  hasTiers: userHasMembershipTiers(state),
  supportersList: selectMySupportersList(state),
  userHasExperimentalUi: selectUserExperimentalUi(state),
  userHasOdyseeMembership: selectUserHasValidOdyseeMembership(state),
});

export default connect(select)(TabWrapper);
