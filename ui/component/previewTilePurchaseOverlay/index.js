import { connect } from 'react-redux';
import {
  selectPreorderTagForUri,
  selectPurchaseTagForUri,
  selectPreorderContentClaimIdForUri,
  selectRentalTagForUri,
} from 'redux/selectors/claims';

import PreviewTilePurchaseOverlay from './view';

const select = (state, props) => {
  return {
    preorderTag: selectPreorderTagForUri(state, props.uri),
    purchaseTag: selectPurchaseTagForUri(state, props.uri),
    rentalTag: selectRentalTagForUri(state, props.uri),
    preorderContentClaimId: selectPreorderContentClaimIdForUri(state, props.uri),
  };
};

export default connect(select, null)(PreviewTilePurchaseOverlay);
