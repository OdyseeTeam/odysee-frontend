import { connect } from 'react-redux';
import { doSortCollectionByKey } from 'redux/actions/collections';
import SortButton from './view';

const perform = {
  doSortCollectionByKey,
};

export default connect(null, perform)(SortButton);
