import { connect } from 'react-redux';

import {
  selectMyPublishedCollections,
  selectMyUnpublishedCollections,
  selectIsFetchingMyCollections,
} from 'redux/selectors/collections';
import { doFetchCollectionListMine } from 'redux/actions/collections';

import ClaimCollectionAdd from './view';

const select = (state, props) => ({
  published: selectMyPublishedCollections(state),
  unpublished: selectMyUnpublishedCollections(state),
  fetchingMine: selectIsFetchingMyCollections(state),
});

const perform = {
  doFetchCollectionListMine,
};

export default connect(select, perform)(ClaimCollectionAdd);
