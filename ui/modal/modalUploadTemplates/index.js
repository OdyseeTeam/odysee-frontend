import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { selectActiveChannelClaim, selectActiveChannelId } from 'redux/selectors/app';
import { selectUploadTemplatesForActiveChannel, selectSettingsForChannelId } from 'redux/selectors/comments';
import { doUpdateCreatorSettings } from 'redux/actions/comments';
import { doToast } from 'redux/actions/notifications';
import ModalUploadTemplates from './view';

const select = (state) => {
  const activeChannelId = selectActiveChannelId(state);
  return {
    templates: selectUploadTemplatesForActiveChannel(state),
    activeChannelClaim: selectActiveChannelClaim(state),
    channelSettings: activeChannelId ? selectSettingsForChannelId(state, activeChannelId) : undefined,
  };
};

const perform = {
  doHideModal,
  doUpdateCreatorSettings,
  doToast,
};

export default connect(select, perform)(ModalUploadTemplates);
