import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import StripeAccountConnection from './view';
import { doToast } from 'redux/actions/notifications';
import { doTipAccountStatus } from 'redux/actions/stripe';
import {
  selectPendingConfirmation,
  selectAccountNotConfirmedButReceivedTips,
  selectStripeConnectionUrl,
  selectAccountStatus,
} from 'redux/selectors/stripe';

const select = (state) => ({
  accountPendingConfirmation: selectPendingConfirmation(state),
  accountNotConfirmedButReceivedTips: selectAccountNotConfirmedButReceivedTips(state),
  stripeConnectionUrl: selectStripeConnectionUrl(state),
  accountStatus: selectAccountStatus(state),
});

const perform = {
  doToast,
  doTipAccountStatus,
};

export default withRouter(connect(select, perform)(StripeAccountConnection));
