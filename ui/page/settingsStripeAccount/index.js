import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { doTipAccountStatus, doGetAndSetAccountLink } from 'redux/actions/stripe';
import {
  selectAccountUnpaidBalance,
  selectAccountChargesEnabled,
  selectAccountRequiresVerification,
  selectAccountLinkResponse,
  selectAccountId,
} from 'redux/selectors/stripe';

import StripeAccountConnection from './view';

const select = (state) => ({
  unpaidBalance: selectAccountUnpaidBalance(state),
  chargesEnabled: selectAccountChargesEnabled(state),
  accountRequiresVerification: selectAccountRequiresVerification(state),
  accountLinkResponse: selectAccountLinkResponse(state),
  accountId: selectAccountId(state),
});

const perform = {
  doTipAccountStatus,
  doGetAndSetAccountLink,
};

export default withRouter(connect(select, perform)(StripeAccountConnection));
