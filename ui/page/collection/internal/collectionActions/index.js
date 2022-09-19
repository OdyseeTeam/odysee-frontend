import { connect } from 'react-redux';
import { selectClaimForUri } from 'redux/selectors/claims';
import {
  selectCollectionIsMineForId,
  selectCollectionIsEmptyForId,
  selectIsCollectionSavedForId,
  selectCollectionTypeForId,
} from 'redux/selectors/collections';
import { doOpenModal } from 'redux/actions/app';
import { doToggleCollectionSavedForId } from 'redux/actions/collections';

import CollectionActions from './view';

const select = (state, props) => {
  const { uri, collectionId } = props;

  const { claim_id: claimId } = selectClaimForUri(state, uri) || {};

  return {
    claimId,
    isMyCollection: selectCollectionIsMineForId(state, collectionId),
    collectionEmpty: selectCollectionIsEmptyForId(state, collectionId),
    isCollectionSaved: selectIsCollectionSavedForId(state, collectionId),
    collectionType: selectCollectionTypeForId(state, collectionId),
  };
};

const perform = {
  doOpenModal,
  doToggleCollectionSavedForId,
};

export default connect(select, perform)(CollectionActions);
