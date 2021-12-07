import { connect } from 'react-redux';
import { makeSelectCoverForUri } from 'redux/selectors/claims';
import Wallpaper from './view';

const select = (state, props) => {
  return {
    cover: makeSelectCoverForUri(props.uri)(state),
  };
};

export default connect(select)(Wallpaper);
