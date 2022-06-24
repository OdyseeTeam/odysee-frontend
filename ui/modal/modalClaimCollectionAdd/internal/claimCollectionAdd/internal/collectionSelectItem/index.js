import { connect } from 'react-redux';
import { selectCollectionForId, selectCollectionForIdHasClaimUrl } from 'redux/selectors/collections';
import { makeSelectClaimIsPending } from 'redux/selectors/claims';
import { doCollectionEdit } from 'redux/actions/collections';
import CollectionSelectItem from './view';

const select = (state, props) => {
  const { collectionId, uri } = props;

  return {
    collection: selectCollectionForId(state, collectionId),
    collectionHasClaim: selectCollectionForIdHasClaimUrl(state, collectionId, uri),
    collectionPending: makeSelectClaimIsPending(collectionId)(state),
  };
};

const perform = {
  doCollectionEdit,
};

export default connect(select, perform)(CollectionSelectItem);
