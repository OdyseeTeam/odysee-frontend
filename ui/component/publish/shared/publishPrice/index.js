import { connect } from 'react-redux';
import { selectPublishFormValue } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { doCustomerPurchaseCost, doTipAccountStatus } from 'redux/actions/stripe';
import { selectAccountChargesEnabled } from 'redux/selectors/stripe';
import { isStreamPlaceholderClaim } from 'util/claim';
import PublishPrice from './view';
import {
  selectClaimForUri,
} from 'redux/selectors/claims';

const select = (state, props) => {
  const { claim } = props;
  l('claim');
  l(claim);

  return {
    chargesEnabled: selectAccountChargesEnabled(state),
    fee: selectPublishFormValue(state, 'fee'),
    fiatPurchaseEnabled: selectPublishFormValue(state, 'fiatPurchaseEnabled'),
    fiatPurchaseFee: selectPublishFormValue(state, 'fiatPurchaseFee'),
    fiatRentalEnabled: selectPublishFormValue(state, 'fiatRentalEnabled'),
    fiatRentalExpiration: selectPublishFormValue(state, 'fiatRentalExpiration'),
    fiatRentalFee: selectPublishFormValue(state, 'fiatRentalFee'),
    fileMime: selectPublishFormValue(state, 'fileMime'),
    isMarkdownPost: selectPublishFormValue(state, 'isMarkdownPost'),
    isUnlistedContent: selectPublishFormValue(state, 'visibility') === 'unlisted',
    paywall: selectPublishFormValue(state, 'paywall'),
    restrictedToMemberships: selectPublishFormValue(state, 'restrictedToMemberships'),
    streamType: selectPublishFormValue(state, 'streamType'),
    editedReleaseTime: selectPublishFormValue(state, 'releaseTimeEdited'),
    releaseTime: selectPublishFormValue(state, 'releaseTime'),
    isLivestreamClaim: isStreamPlaceholderClaim(claim),
  };
};

const perform = {
  updatePublishForm: doUpdatePublishForm,
  doTipAccountStatus,
  doCustomerPurchaseCost,
};

export default connect(select, perform)(PublishPrice);
