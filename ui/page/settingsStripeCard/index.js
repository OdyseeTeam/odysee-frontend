import { connect } from 'react-redux';
import { doSetPreferredCurrency } from 'redux/actions/settings';
import { selectPreferredCurrency } from 'redux/selectors/settings';
import {
  selectCustomerStatusFetching,
  selectCustomerStatus,
  selectHasSavedCard,
  selectCardDetails,
} from 'redux/selectors/stripe';
import { selectUserEmail } from 'redux/selectors/user';
import { doOpenModal } from 'redux/actions/app';
import { doGetCustomerStatus, doRemoveCardForPaymentMethodId } from 'redux/actions/stripe';
import { doToast } from 'redux/actions/notifications';

import SettingsStripeCard from './view';

const select = (state) => ({
  email: selectUserEmail(state),
  preferredCurrency: selectPreferredCurrency(state),
  customerStatusFetching: selectCustomerStatusFetching(state),
  customerStatus: selectCustomerStatus(state),
  hasSavedCard: selectHasSavedCard(state),
  cardDetails: selectCardDetails(state),
});

const perform = {
  doGetCustomerStatus,
  doOpenModal,
  doToast,
  doSetPreferredCurrency,
  doRemoveCardForPaymentMethodId,
};

export default connect(select, perform)(SettingsStripeCard);
