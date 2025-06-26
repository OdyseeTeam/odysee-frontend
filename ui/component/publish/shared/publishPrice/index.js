import { connect } from 'react-redux';
import { selectMemberRestrictionStatus, selectPublishFormValue } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { doCustomerPurchaseCost, doTipAccountStatus } from 'redux/actions/stripe';
import { selectAccountChargesEnabled, selectArweaveDefaultAccountMonetizationEnabled } from 'redux/selectors/stripe';
import PublishPrice from './view';

const select = (state) => ({
  paywall: selectPublishFormValue(state, 'paywall'),
  fiatPurchaseEnabled: selectPublishFormValue(state, 'fiatPurchaseEnabled'),
  fiatPurchaseFee: selectPublishFormValue(state, 'fiatPurchaseFee'),
  fiatRentalEnabled: selectPublishFormValue(state, 'fiatRentalEnabled'),
  fiatRentalFee: selectPublishFormValue(state, 'fiatRentalFee'),
  fiatRentalExpiration: selectPublishFormValue(state, 'fiatRentalExpiration'),
  fee: selectPublishFormValue(state, 'fee'),
  chargesEnabled: selectAccountChargesEnabled(state),
  memberRestrictionStatus: selectMemberRestrictionStatus(state),
  visibility: selectPublishFormValue(state, 'visibility'),
  monetizationStatus: selectArweaveDefaultAccountMonetizationEnabled(state),
});

const perform = {
  updatePublishForm: doUpdatePublishForm,
  doTipAccountStatus,
  doCustomerPurchaseCost,
};

export default connect(select, perform)(PublishPrice);
