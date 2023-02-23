import { connect } from 'react-redux';
import CollectionCreate from './view';
import { doToast } from 'redux/actions/notifications';

const perform = {
  doToast,
};

export default connect(null, perform)(CollectionCreate);
