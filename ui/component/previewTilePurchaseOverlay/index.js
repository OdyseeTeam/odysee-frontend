import { connect } from 'react-redux';
import {
  selectPreorderTagForUri,
  selectPurchaseTagForUri,
  selectPreorderContentClaimIdForUri,
} from 'redux/selectors/claims';

import PreviewTilePurchaseOverlay from './view';

const select = (state, props) => {
  return {
    preorderTag: selectPreorderTagForUri(state, props.uri),
    purchaseTag: selectPurchaseTagForUri(state, props.uri),
    preorderContentClaimId: selectPreorderContentClaimIdForUri(state, props.uri),
  };
};

export default connect(select, null)(PreviewTilePurchaseOverlay);
