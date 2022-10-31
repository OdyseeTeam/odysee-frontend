import { connect } from 'react-redux';
import { doEnableCollectionShuffle } from 'redux/actions/content';
import ShuffleButton from './view';

const perform = {
  doEnableCollectionShuffle,
};

export default connect(null, perform)(ShuffleButton);
