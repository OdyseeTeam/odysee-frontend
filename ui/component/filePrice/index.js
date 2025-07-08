import { connect } from 'react-redux';
import {
  selectClaimForUri,
  selectClaimWasPurchasedForUri,
  selectRentalTagForUri,
  selectPurchaseTagForUri,
  selectIsFiatPaidForUri,
  selectIsFetchingPurchases,
  selectCostInfoForUri,
} from 'redux/selectors/claims';
import { doTipAccountCheckForUri } from 'redux/actions/stripe';
import FilePrice from './view';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);

  const purchaseTag = selectPurchaseTagForUri(state, props.uri);
  const costInfo = selectCostInfoForUri(state, props.uri);

  let customPrices;
  if (purchaseTag && costInfo?.cost > 0 && costInfo.feeCurrency === 'LBC') {
    customPrices = {
      priceFiat: Number(purchaseTag),
      priceLBC: Number(costInfo.cost),
    };
  }

  return {
    claim,
    sdkPaid: selectClaimWasPurchasedForUri(state, props.uri),
    fiatPaid: selectIsFiatPaidForUri(state, props.uri),
    costInfo,
    rentalInfo: selectRentalTagForUri(state, props.uri),
    customPrices,
    purchaseInfo: purchaseTag,
    isFetchingPurchases: selectIsFetchingPurchases(state),
  };
};

const perform = {
  doTipAccountCheckForUri,
};

export default connect(select, perform)(FilePrice);
