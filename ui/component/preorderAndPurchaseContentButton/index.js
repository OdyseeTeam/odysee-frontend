import { connect } from 'react-redux';
import {
  selectPreorderTagForUri,
  selectClaimForUri,
  selectClaimIsMine,
  selectPreorderContentClaimIdForUri,
  selectClaimForId,
  selectPurchaseTagForUri,
  selectPurchaseMadeForClaimId,
  selectRentalTagForUri,
  selectPurchaseForClaimId,
} from 'redux/selectors/claims';
import PreorderAndPurchaseButton from './view';
import { doOpenModal } from 'redux/actions/app';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting } from 'redux/selectors/settings';
import { doResolveClaimIds, doCheckIfPurchasedClaimId } from 'redux/actions/claims';
import { getChannelIdFromClaim, getChannelNameFromClaim } from 'util/claim';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);

  const preorderContentClaimId = selectPreorderContentClaimIdForUri(state, props.uri);
  const channelClaimId = getChannelIdFromClaim(claim);

  const channelName = getChannelNameFromClaim(claim);

  const purchaseForClaimId = selectPurchaseForClaimId(state, claim.claim_id);

  return {
    channelClaimId,
    channelName,
    claim,
    claimIsMine: selectClaimIsMine(state, claim),
    preferredCurrency: selectClientSetting(state, SETTINGS.PREFERRED_CURRENCY),
    preorderContentClaim: selectClaimForId(state, preorderContentClaimId),
    preorderContentClaimId: selectPreorderContentClaimIdForUri(state, props.uri),
    preorderTag: selectPreorderTagForUri(state, props.uri),
    purchaseContentTag: selectPurchaseTagForUri(state, props.uri),
    purchaseMadeForClaimId: Boolean(purchaseForClaimId && purchaseForClaimId.length),
    purchaseTag: selectPurchaseTagForUri(state, props.uri),
    rentalTag: selectRentalTagForUri(state, props.uri),
    purchaseForClaimId,
  };
};

const perform = {
  doOpenModal,
  doResolveClaimIds,
  doCheckIfPurchasedClaimId,
};

export default connect(select, perform)(PreorderAndPurchaseButton);
