import { connect } from 'react-redux';
import {
  selectPreorderTagForUri,
  selectClaimForUri,
  selectClaimIsMine,
  selectPreorderContentClaimIdForUri,
  selectClaimForId,
} from 'redux/selectors/claims';
import PreorderButton from './view';
import { doOpenModal } from 'redux/actions/app';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting } from 'redux/selectors/settings';
import { doResolveClaimIds } from 'redux/actions/claims';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);

  const preorderContentClaimId = selectPreorderContentClaimIdForUri(state, props.uri);

  return {
    preorderTag: selectPreorderTagForUri(state, props.uri),
    claimIsMine: selectClaimIsMine(state, claim),
    claim,
    preferredCurrency: selectClientSetting(state, SETTINGS.PREFERRED_CURRENCY),
    preorderContentClaimId: selectPreorderContentClaimIdForUri(state, props.uri),
    preorderContentClaim: selectClaimForId(state, preorderContentClaimId),
  };
};

const perform = {
  doOpenModal,
  doResolveClaimIds,
};

export default connect(select, perform)(PreorderButton);
