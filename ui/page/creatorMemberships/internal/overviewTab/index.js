import { connect } from 'react-redux';
import { selectAccountChargesEnabled } from 'redux/selectors/stripe';
import { doSetActiveChannel } from 'redux/actions/app';
import OverviewTab from './view';

const select = (state) => ({
  bankAccountConfirmed: selectAccountChargesEnabled(state),
});

const perform = {
  doSetActiveChannel,
};

export default connect(select, perform)(OverviewTab);
