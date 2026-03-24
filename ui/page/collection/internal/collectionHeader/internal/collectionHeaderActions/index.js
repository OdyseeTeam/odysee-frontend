import { connect } from 'react-redux';
import { selectClaimForUri } from 'redux/selectors/claims';
import {
  selectCollectionIsMine,
  selectCollectionIsEmptyForId,
  selectCollectionSavedForId,
  selectCollectionTypeForId,
  selectCollectionAutoPublishForId,
  selectCollectionIsPublishingForId,
  selectCollectionPublishErrorForId,
  selectCollectionHasEditsForId,
} from 'redux/selectors/collections';
import { doOpenModal } from 'redux/actions/app';
import {
  doToggleCollectionSavedForId,
  doSortCollectionByKey,
  doSetCollectionAutoPublish,
  doRetryCollectionPublish,
} from 'redux/actions/collections';
import { doEnableCollectionShuffle } from 'redux/actions/content';

import CollectionHeaderActions from './view';

const select = (state, props) => {
  const { uri, collectionId } = props;

  const { claim_id: claimId } = selectClaimForUri(state, uri) || {};

  return {
    claimId,
    isMyCollection: selectCollectionIsMine(state, collectionId),
    collectionEmpty: selectCollectionIsEmptyForId(state, collectionId),
    collectionSavedForId: selectCollectionSavedForId(state, collectionId),
    collectionType: selectCollectionTypeForId(state, collectionId),
    autoPublish: selectCollectionAutoPublishForId(state, collectionId),
    isPublishing: selectCollectionIsPublishingForId(state, collectionId),
    publishError: selectCollectionPublishErrorForId(state, collectionId),
    collectionHasEdits: selectCollectionHasEditsForId(state, collectionId),
  };
};

const perform = {
  doOpenModal,
  doToggleCollectionSavedForId,
  doSortCollectionByKey,
  doEnableCollectionShuffle,
  doSetCollectionAutoPublish,
  doRetryCollectionPublish,
};

export default connect(select, perform)(CollectionHeaderActions);
