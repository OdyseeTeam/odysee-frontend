import { connect } from 'react-redux';
import ChannelPreview from './view';

const select = (state, props) => {
  const { uri } = props;

  console.log('uri: ', uri);

  return {};
};

const perform = {};

export default connect(select, perform)(ChannelPreview);
