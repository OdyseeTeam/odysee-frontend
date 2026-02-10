import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectUploadTemplatesForActiveChannel } from 'redux/selectors/comments';
import { doUpdateCreatorSettings } from 'redux/actions/comments';
import { doToast } from 'redux/actions/notifications';
import ModalUploadTemplates from './view';

const select = (state) => ({
  templates: selectUploadTemplatesForActiveChannel(state),
  activeChannelClaim: selectActiveChannelClaim(state),
});

const perform = {
  doHideModal,
  doUpdateCreatorSettings,
  doToast,
};

export default connect(select, perform)(ModalUploadTemplates);
