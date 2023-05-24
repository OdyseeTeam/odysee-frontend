import { connect } from 'react-redux';
import { selectBalance } from 'redux/selectors/wallet';
import { selectIsStillEditing, selectPublishFormValue } from 'redux/selectors/publish';
import { doUpdateFile, doUpdatePublishForm } from 'redux/actions/publish';
import PublishLivestream from './view';

const select = (state) => ({
  title: selectPublishFormValue(state, 'title'),
  filePath: selectPublishFormValue(state, 'filePath'),
  fileBitrate: state.publish.fileBitrate,
  fileSizeTooBig: state.publish.fileSizeTooBig,
  liveCreateType: state.publish.liveCreateType,
  liveEditType: state.publish.liveEditType,
  isStillEditing: selectIsStillEditing(state),
  balance: selectBalance(state),
  publishing: selectPublishFormValue(state, 'publishing'),
  duration: selectPublishFormValue(state, 'fileDur'),
  isVid: selectPublishFormValue(state, 'fileVid'),
});

const perform = {
  doUpdatePublishForm,
  doUpdateFile,
};

export default connect(select, perform)(PublishLivestream);
