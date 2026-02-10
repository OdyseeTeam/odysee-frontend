import { connect } from 'react-redux';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectPublishFormValues } from 'redux/selectors/publish';
import { selectUploadTemplatesForActiveChannel } from 'redux/selectors/comments';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { doUpdateCreatorSettings } from 'redux/actions/comments';
import { doOpenModal } from 'redux/actions/app';
import { doToast } from 'redux/actions/notifications';
import PublishTemplateButton from './view';

const select = (state) => ({
  templates: selectUploadTemplatesForActiveChannel(state),
  activeChannelClaim: selectActiveChannelClaim(state),
  publishFormValues: selectPublishFormValues(state),
});

const perform = {
  openModal: doOpenModal,
  updatePublishForm: doUpdatePublishForm,
  doUpdateCreatorSettings,
  doToast,
};

export default connect(select, perform)(PublishTemplateButton);
