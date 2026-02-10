import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doPopulatePublishFormFromClaim, doSearchMyUploads } from 'redux/actions/publish';
import ModalCopyFromUpload from './view';

const perform = {
  doHideModal,
  searchUploads: doSearchMyUploads,
  doPopulatePublishFormFromClaim,
};

export default connect(null, perform)(ModalCopyFromUpload);
