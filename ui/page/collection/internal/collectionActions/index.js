import { connect } from 'react-redux';
import { selectClaimForUri, makeSelectTagInClaimOrChannelForUri } from 'redux/selectors/claims';
import {
  selectCollectionIsMine,
  selectCollectionIsEmptyForId,
  selectCollectionSavedForId,
  selectCollectionTypeForId,
} from 'redux/selectors/collections';
import { doOpenModal } from 'redux/actions/app';
import { DISABLE_REACTIONS_VIDEO_TAG } from 'constants/tags';
import { doToggleCollectionSavedForId } from 'redux/actions/collections';

import CollectionActions from './view';

const select = (state, props) => {
  const { uri, collectionId } = props;

  const { claim_id: claimId } = selectClaimForUri(state, uri) || {};

  return {
    claimId,
    disableFileReactions: makeSelectTagInClaimOrChannelForUri(uri, DISABLE_REACTIONS_VIDEO_TAG)(state),
    isMyCollection: selectCollectionIsMine(state, collectionId),
    collectionEmpty: selectCollectionIsEmptyForId(state, collectionId),
    collectionSavedForId: selectCollectionSavedForId(state, collectionId),
    collectionType: selectCollectionTypeForId(state, collectionId),
  };
};

const perform = {
  doOpenModal,
  doToggleCollectionSavedForId,
};

export default connect(select, perform)(CollectionActions);
