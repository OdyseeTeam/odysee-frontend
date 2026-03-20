import { connect } from 'react-redux';
import { selectClaimIsPendingForId } from 'redux/selectors/claims';
import {
  selectCollectionHasEditsForId,
  selectCollectionLengthForId,
  selectCollectionAutoPublishForId,
  selectCollectionIsPublishingForId,
  selectCollectionPublishErrorForId,
} from 'redux/selectors/collections';
import CollectionPublishButton from './view';

const select = (state, props) => {
  const { collectionId } = props;
  return {
    claimIsPending: selectClaimIsPendingForId(state, collectionId),
    collectionHasEdits: selectCollectionHasEditsForId(state, collectionId),
    collectionLength: selectCollectionLengthForId(state, collectionId),
    autoPublish: selectCollectionAutoPublishForId(state, collectionId),
    isPublishing: selectCollectionIsPublishingForId(state, collectionId),
    publishError: selectCollectionPublishErrorForId(state, collectionId),
  };
};

export default connect(select)(CollectionPublishButton);
