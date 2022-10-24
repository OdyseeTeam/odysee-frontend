import { connect } from 'react-redux';
import {
  selectClaimIsMineForUri,
  makeSelectIsAbandoningClaimForUri,
  makeSelectClaimForClaimId,
} from 'redux/selectors/claims';
import { doCollectionDelete, doLocalCollectionCreate } from 'redux/actions/collections';
import { selectCollectionTitleForId, selectUrlsForCollectionId } from 'redux/selectors/collections';
import { doHideModal } from 'redux/actions/app';
import { selectCollectionClaimUploadParamsForId } from 'redux/selectors/publish';
import ModalRemoveCollection from './view';

const select = (state, props) => {
  const { collectionId } = props;

  const claim = makeSelectClaimForClaimId(collectionId)(state);
  const uri = (claim && (claim.canonical_url || claim.permanent_url)) || null;
  return {
    claim,
    uri,
    claimIsMine: selectClaimIsMineForUri(state, uri),
    isAbandoning: makeSelectIsAbandoningClaimForUri(uri)(state),
    collectionName: selectCollectionTitleForId(state, collectionId),
    collectionParams: selectCollectionClaimUploadParamsForId(state, collectionId),
    collectionUrls: selectUrlsForCollectionId(state, collectionId),
  };
};

const perform = {
  doHideModal,
  doCollectionDelete,
  doLocalCollectionCreate,
};

export default connect(select, perform)(ModalRemoveCollection);
