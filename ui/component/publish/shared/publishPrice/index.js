import { connect } from 'react-redux';
import { selectMemberRestrictionStatus, selectPublishFormValue } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { doCustomerPurchaseCost, doTipAccountStatus } from 'redux/actions/stripe';
import { selectAccountChargesEnabled, selectAccountStatus, selectArweaveDefaultAccountMonetizationEnabled } from 'redux/selectors/stripe';
import PublishPrice from './view';

const select = (state) => ({
  fileMime: selectPublishFormValue(state, 'fileMime'),
  streamType: selectPublishFormValue(state, 'streamType'),
  paywall: selectPublishFormValue(state, 'paywall'),
  fiatPurchaseEnabled: selectPublishFormValue(state, 'fiatPurchaseEnabled'),
  fiatPurchaseFee: selectPublishFormValue(state, 'fiatPurchaseFee'),
  fiatRentalEnabled: selectPublishFormValue(state, 'fiatRentalEnabled'),
  fiatRentalFee: selectPublishFormValue(state, 'fiatRentalFee'),
  fiatRentalExpiration: selectPublishFormValue(state, 'fiatRentalExpiration'),
  fee: selectPublishFormValue(state, 'fee'),
  chargesEnabled: selectAccountChargesEnabled(state),
  memberRestrictionStatus: selectMemberRestrictionStatus(state),
  type: state.publish.type,
  visibility: selectPublishFormValue(state, 'visibility'),
  accountStatus: selectAccountStatus(state),
  monetizationStatus: selectArweaveDefaultAccountMonetizationEnabled(state),
});

const perform = {
  updatePublishForm: doUpdatePublishForm,
  doTipAccountStatus,
  doCustomerPurchaseCost,
};

export default connect(select, perform)(PublishPrice);
