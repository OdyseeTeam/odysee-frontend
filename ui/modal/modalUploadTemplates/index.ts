import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { selectActiveChannelId } from 'redux/selectors/app';
import { selectMyChannelClaims } from 'redux/selectors/claims';
import { selectSettingsByChannelId } from 'redux/selectors/comments';
import { doFetchCreatorSettings, doUpdateCreatorSettings } from 'redux/actions/comments';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { doToast } from 'redux/actions/notifications';
import ModalUploadTemplates from './view';

const select = (state) => {
  const activeChannelId = selectActiveChannelId(state) || '';
  return {
    defaultChannelId: activeChannelId,
    myChannelClaims: selectMyChannelClaims(state) || [],
    settingsByChannelId: selectSettingsByChannelId(state) || {},
  };
};

const perform = {
  doHideModal,
  fetchCreatorSettings: doFetchCreatorSettings,
  updatePublishForm: doUpdatePublishForm,
  doUpdateCreatorSettings,
  doToast,
};
export default connect(select, perform)(ModalUploadTemplates);
