import { connect } from 'react-redux';
import { selectStreamingUrlForUri } from 'redux/selectors/file_info';
import { makeSelectContentTypeForUri } from 'redux/selectors/claims';
import VideoRender from './view';

const select = (state, props) => ({
  streamingUrl: selectStreamingUrlForUri(state, props.uri),
  contentType: makeSelectContentTypeForUri(props.uri)(state),
});

export default connect(select)(VideoRender);
