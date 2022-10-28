import { connect } from 'react-redux';

import { selectClaimForId, selectHasClaimForId, selectTotalStakedAmountForUri } from 'redux/selectors/claims';
import {
  selectCollectionDescriptionForId,
  selectCountForCollectionId,
  selectCollectionHasEditsForId,
  selectSourceIdForCollectionId,
  selectIsCollectionFeaturedChannelForId,
} from 'redux/selectors/collections';

import CollectionHeader from './view';

const select = (state, props) => {
  const { collectionId } = props;

  const claim = collectionId && selectClaimForId(state, collectionId);
  const uri = (claim && (claim.canonical_url || claim.permanent_url)) || null;

  return {
    uri,
    collectionDescription: selectCollectionDescriptionForId(state, collectionId),
    collectionCount: selectCountForCollectionId(state, collectionId),
    collectionHasEdits: selectCollectionHasEditsForId(state, collectionId),
    sourceId: selectSourceIdForCollectionId(state, collectionId),
    hasClaim: selectHasClaimForId(state, collectionId),
    claimAmount: selectTotalStakedAmountForUri(state, uri),
    isFeaturedChannels: selectIsCollectionFeaturedChannelForId(state, collectionId),
  };
};

export default connect(select)(CollectionHeader);
