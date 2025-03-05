import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { doTipAccountStatus, doTipAccountRemove } from 'redux/actions/stripe';
import { doOpenModal } from 'redux/actions/app';
import {
  selectAccountPaidBalance,
  selectAccountChargesEnabled,
  selectAccountRequiresVerification,
  selectAccountInfo,
} from 'redux/selectors/stripe';

import StripeAccountConnection from './view';

const select = (state) => ({
  paidBalance: selectAccountPaidBalance(state),
  chargesEnabled: selectAccountChargesEnabled(state),
  accountRequiresVerification: selectAccountRequiresVerification(state),
  accountInfo: selectAccountInfo(state),
});

const perform = {
  doTipAccountStatus,
  doOpenModal,
  doTipAccountRemove,
};

export default withRouter(connect(select, perform)(StripeAccountConnection));
