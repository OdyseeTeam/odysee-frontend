import { connect } from 'react-redux';
import { doToggleShuffleList } from 'redux/actions/content';
import ShuffleButton from './view';

const perform = {
  doToggleShuffleList,
};

export default connect(null, perform)(ShuffleButton);
