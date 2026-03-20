import { connect } from 'react-redux';
import {
  selectCollectionTitleForId,
  selectIsCollectionBuiltInForId,
  selectPublishedCollectionNotEditedForId,
  selectCollectionIsEmptyForId,
  selectCollectionIsMine,
  selectCollectionAutoPublishForId,
  selectCollectionHasEditsForId,
  selectCollectionPublishErrorForId,
} from 'redux/selectors/collections';
import { selectClaimForClaimId } from 'redux/selectors/claims';
import { doOpenModal } from 'redux/actions/app';
import { doEnableCollectionShuffle } from 'redux/actions/content';
import { doSetCollectionAutoPublish, doRetryCollectionPublish } from 'redux/actions/collections';
import CollectionMenuList from './view';

const select = (state, props) => {
  const collectionId = props.collectionId;
  return {
    collectionName: selectCollectionTitleForId(state, collectionId),
    claimId: (selectClaimForClaimId(state, collectionId) || {}).claim_id,
    isBuiltin: selectIsCollectionBuiltInForId(state, collectionId),
    publishedNotEdited: selectPublishedCollectionNotEditedForId(state, collectionId),
    collectionEmpty: selectCollectionIsEmptyForId(state, collectionId),
    isMyCollection: selectCollectionIsMine(state, collectionId),
    autoPublish: selectCollectionAutoPublishForId(state, collectionId),
    collectionHasEdits: selectCollectionHasEditsForId(state, collectionId),
    publishError: selectCollectionPublishErrorForId(state, collectionId),
  };
};

const perform = {
  doOpenModal,
  doEnableCollectionShuffle,
  doSetCollectionAutoPublish,
  doRetryCollectionPublish,
};
export default connect(select, perform)(CollectionMenuList);
