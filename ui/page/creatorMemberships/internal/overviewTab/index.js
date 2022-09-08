import { connect } from 'react-redux';
import { selectAccountChargesEnabled } from 'redux/selectors/stripe';
import OverviewTab from './view';

const select = (state) => ({
  bankAccountConfirmed: selectAccountChargesEnabled(state),
});

export default connect(select)(OverviewTab);
