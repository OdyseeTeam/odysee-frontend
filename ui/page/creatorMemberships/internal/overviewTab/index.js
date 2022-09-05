import { connect } from 'react-redux';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectAccountChargesEnabled } from 'redux/selectors/stripe';
import { doTipAccountStatus } from 'redux/actions/stripe';
import OverviewTab from './view';

const select = (state) => ({
  activeChannelClaim: selectActiveChannelClaim(state),
  bankAccountConfirmed: selectAccountChargesEnabled(state),
});

const perform = {
  doTipAccountStatus,
};

export default connect(select, perform)(OverviewTab);
