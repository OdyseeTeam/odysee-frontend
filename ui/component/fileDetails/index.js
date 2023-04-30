import { connect } from 'react-redux';
import { makeSelectContentTypeForUri, makeSelectMetadataForUri, selectClaimForUri } from 'redux/selectors/claims';
import { makeSelectFileInfoForUri } from 'redux/selectors/file_info';
import { selectUser } from 'redux/selectors/user';
import { doOpenFileInFolder } from 'redux/actions/file';
import FileDetails from './view';

const select = (state, props) => ({
  claim: selectClaimForUri(state, props.uri, false),
  contentType: makeSelectContentTypeForUri(props.uri)(state),
  fileInfo: makeSelectFileInfoForUri(props.uri)(state),
  metadata: makeSelectMetadataForUri(props.uri)(state),
  user: selectUser(state),
});

const perform = (dispatch) => ({
  openFolder: (path) => dispatch(doOpenFileInFolder(path)),
});

export default connect(select, perform)(FileDetails);
