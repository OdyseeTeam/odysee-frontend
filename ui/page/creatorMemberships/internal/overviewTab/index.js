import { connect } from 'react-redux';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectMyChannelClaims } from 'redux/selectors/claims';
import { selectAccountChargesEnabled } from 'redux/selectors/stripe';
import { doTipAccountStatus } from 'redux/actions/stripe';
import OverviewTab from './view';

const select = (state) => ({
  activeChannelClaim: selectActiveChannelClaim(state),
  bankAccountConfirmed: selectAccountChargesEnabled(state),
  myChannelClaims: selectMyChannelClaims(state),
});

const perform = {
  doTipAccountStatus,
};

export default connect(select, perform)(OverviewTab);
