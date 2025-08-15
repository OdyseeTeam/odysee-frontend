import { connect } from 'react-redux';
import { selectBalance } from 'redux/selectors/wallet';
import { selectIsStillEditing, selectPublishFormValue, selectMyClaimForUri } from 'redux/selectors/publish';
import { doUpdateFile, doUpdatePublishForm, doUpdateTitle } from 'redux/actions/publish';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import PublishFile from './view';

const select = (state, props) => ({
  name: selectPublishFormValue(state, 'name'),
  title: selectPublishFormValue(state, 'title'),
  filePath: selectPublishFormValue(state, 'filePath'),
  fileBitrate: state.publish.fileBitrate,
  fileSizeTooBig: state.publish.fileSizeTooBig,
  isStillEditing: selectIsStillEditing(state),
  balance: selectBalance(state),
  duration: selectPublishFormValue(state, 'fileDur'),
  isVid: selectPublishFormValue(state, 'fileVid'),
  myClaimForUri: selectMyClaimForUri(state),
  activeChannelClaim: selectActiveChannelClaim(state),
});

const perform = {
  doUpdatePublishForm,
  doUpdateFile,
  doUpdateTitle,
};

export default connect(select, perform)(PublishFile);
