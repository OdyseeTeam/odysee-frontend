import { connect } from 'react-redux';
import {
  selectHasClaimForId,
  selectClaimIsPendingForId,
  selectClaimForId,
  selectGeoRestrictionForUri,
} from 'redux/selectors/claims';
import {
  selectCollectionForId,
  selectBrokenUrlsForCollectionId,
  selectCollectionIsMine,
  selectHasPrivateCollectionForId,
  selectIsCollectionPrivateForId,
} from 'redux/selectors/collections';
import { doResolveClaimId } from 'redux/actions/claims';
import { doCollectionEdit, doRemoveFromUnsavedChangesCollectionsForCollectionId } from 'redux/actions/collections';
import CollectionPage from './view';
import { useParams } from 'react-router-dom';
import React from 'react';

const select = (state, props) => {
  const collectionId = props?.collectionId;
  const claim = selectClaimForId(state, collectionId);
  return {
    collectionId,
    geoRestiction: selectGeoRestrictionForUri(state, claim?.permanent_url),
    hasClaim: selectHasClaimForId(state, collectionId),
    collection: selectCollectionForId(state, collectionId),
    brokenUrls: selectBrokenUrlsForCollectionId(state, collectionId),
    isCollectionMine: selectCollectionIsMine(state, collectionId),
    hasPrivate: selectHasPrivateCollectionForId(state, collectionId),
    isPrivate: selectIsCollectionPrivateForId(state, collectionId),
    isClaimPending: selectClaimIsPendingForId(state, collectionId),
  };
};

const perform = {
  doResolveClaimId,
  doCollectionEdit,
  doRemoveFromUnsavedChangesCollectionsForCollectionId,
};
const ConnectedCollectionPage = connect(select, perform)(CollectionPage);

export default function CollectionRoute(props) {
  const { collectionId = '' } = useParams();
  return React.createElement(ConnectedCollectionPage, { ...props, collectionId: props.collectionId || collectionId });
}
