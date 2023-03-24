import { connect } from 'react-redux';
import { selectClaimForUri } from 'redux/selectors/claims';
import {
  selectCollectionIsMine,
  selectCollectionIsEmptyForId,
  selectCollectionSavedForId,
  selectCollectionTypeForId,
} from 'redux/selectors/collections';
import { doOpenModal } from 'redux/actions/app';
import { doToggleCollectionSavedForId, doSortCollectionByReleaseTime } from 'redux/actions/collections';
import { doEnableCollectionShuffle } from 'redux/actions/content';

import CollectionActions from './view';

const select = (state, props) => {
  const { uri, collectionId } = props;

  const { claim_id: claimId } = selectClaimForUri(state, uri) || {};

  return {
    claimId,
    isMyCollection: selectCollectionIsMine(state, collectionId),
    collectionEmpty: selectCollectionIsEmptyForId(state, collectionId),
    collectionSavedForId: selectCollectionSavedForId(state, collectionId),
    collectionType: selectCollectionTypeForId(state, collectionId),
  };
};

const perform = {
  doOpenModal,
  doToggleCollectionSavedForId,
  doSortCollectionByReleaseTime,
  doEnableCollectionShuffle,
};

export default connect(select, perform)(CollectionActions);
