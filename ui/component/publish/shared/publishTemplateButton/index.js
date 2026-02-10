import { connect } from 'react-redux';
import { selectActiveChannelClaim, selectActiveChannelId } from 'redux/selectors/app';
import { selectPublishFormValues } from 'redux/selectors/publish';
import { selectUploadTemplatesForActiveChannel, selectSettingsForChannelId } from 'redux/selectors/comments';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { doUpdateCreatorSettings } from 'redux/actions/comments';
import { doOpenModal } from 'redux/actions/app';
import { doToast } from 'redux/actions/notifications';
import PublishTemplateButton from './view';

const select = (state) => {
  const activeChannelId = selectActiveChannelId(state);
  return {
    templates: selectUploadTemplatesForActiveChannel(state),
    activeChannelClaim: selectActiveChannelClaim(state),
    publishFormValues: selectPublishFormValues(state),
    channelSettings: activeChannelId ? selectSettingsForChannelId(state, activeChannelId) : undefined,
  };
};

const perform = {
  openModal: doOpenModal,
  updatePublishForm: doUpdatePublishForm,
  doUpdateCreatorSettings,
  doToast,
};

export default connect(select, perform)(PublishTemplateButton);
