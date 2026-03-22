import { connect } from 'react-redux';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import FileRenderDownload from './view';

const select = (state, props) => ({
  renderMode: makeSelectFileRenderModeForUri(props.uri)(state),
});
export default connect(select)(FileRenderDownload);
