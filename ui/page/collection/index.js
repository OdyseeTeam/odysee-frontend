import { connect } from 'react-redux';

import { selectHasClaimForId } from 'redux/selectors/claims';
import {
  selectCollectionForId,
  selectBrokenUrlsForCollectionId,
  selectCollectionIsMine,
  selectHasPrivateCollectionForId,
  selectIsCollectionPrivateForId,
} from 'redux/selectors/collections';

import { doResolveClaimId } from 'redux/actions/claims';

import CollectionPage from './view';

const select = (state, props) => {
  const { match } = props;
  const { params } = match;
  const { collectionId } = params;

  return {
    collectionId,
    hasClaim: selectHasClaimForId(state, collectionId),
    collection: selectCollectionForId(state, collectionId),
    brokenUrls: selectBrokenUrlsForCollectionId(state, collectionId),
    isCollectionMine: selectCollectionIsMine(state, collectionId),
    hasPrivate: selectHasPrivateCollectionForId(state, collectionId),
    isPrivate: selectIsCollectionPrivateForId(state, collectionId),
  };
};

const perform = {
  doResolveClaimId,
};

export default connect(select, perform)(CollectionPage);
