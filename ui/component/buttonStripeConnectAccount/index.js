import { connect } from 'react-redux';

import {
  selectAccountChargesEnabled,
  selectAccountRequiresVerification,
  selectAccountLinkResponse,
} from 'redux/selectors/stripe';

import { doTipAccountStatus, doGetAndSetAccountLink } from 'redux/actions/stripe';

import ButtonStripeConnectAccount from './view';

const select = (state) => ({
  chargesEnabled: selectAccountChargesEnabled(state),
  accountRequiresVerification: selectAccountRequiresVerification(state),
  accountLinkResponse: selectAccountLinkResponse(state),
});

const perform = {
  doTipAccountStatus,
  doGetAndSetAccountLink,
};

export default connect(select, perform)(ButtonStripeConnectAccount);
