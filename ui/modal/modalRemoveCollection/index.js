import { connect } from 'react-redux';
import {
  selectClaimIsMineForUri,
  makeSelectIsAbandoningClaimForUri,
  makeSelectClaimForClaimId,
} from 'redux/selectors/claims';
import { doCollectionDelete } from 'redux/actions/collections';
import { makeSelectNameForCollectionId } from 'redux/selectors/collections';
import { doHideModal } from 'redux/actions/app';
import ModalRemoveCollection from './view';

const select = (state, props) => {
  const { collectionId } = props;

  const claim = makeSelectClaimForClaimId(collectionId)(state);
  const uri = claim ? claim.canonical_url || claim.permanent_url : null;

  return {
    claim,
    claimIsMine: selectClaimIsMineForUri(state, uri),
    collectionName: makeSelectNameForCollectionId(collectionId)(state),
    isAbandoning: makeSelectIsAbandoningClaimForUri(uri)(state),
    uri,
  };
};

const perform = {
  doHideModal,
  doCollectionDelete,
};

export default connect(select, perform)(ModalRemoveCollection);
