import { connect } from 'react-redux';
import { doHideModal, doOpenModal } from 'redux/actions/app';
import { doPopulatePublishFormFromClaim, doSearchMyUploads, doUpdatePublishForm } from 'redux/actions/publish';
import { selectPublishFormValues } from 'redux/selectors/publish';
import { doToast } from 'redux/actions/notifications';
import ModalCopyFromUpload from './view';

const select = (state) => ({
  publishFormValues: selectPublishFormValues(state),
});

const perform = {
  doHideModal,
  doOpenModal,
  searchUploads: doSearchMyUploads,
  doPopulatePublishFormFromClaim,
  updatePublishForm: doUpdatePublishForm,
  doToast,
};

export default connect(select, perform)(ModalCopyFromUpload);
