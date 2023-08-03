// @flow
import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doUploadThumbnail, doUpdatePublishForm } from 'redux/actions/publish';
import type { Props } from './view';
import ModalConfirmThumbnailUpload from './view';

const perform = (dispatch) => ({
  closeModal: () => dispatch(doHideModal()),
  upload: (file, cb) => dispatch(doUploadThumbnail('', file, null, null, file.path, cb)),
  updatePublishForm: (value) => dispatch(doUpdatePublishForm(value)),
});

export default connect<_, Props, _, _, _, _>(null, perform)(ModalConfirmThumbnailUpload);
