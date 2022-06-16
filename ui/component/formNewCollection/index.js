import { connect } from 'react-redux';
import FormNewCollection from './view';
import { doLocalCollectionCreate } from 'redux/actions/collections';

const perform = {
  doLocalCollectionCreate,
};

export default connect(null, perform)(FormNewCollection);
