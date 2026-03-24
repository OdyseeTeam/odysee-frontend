import { connect } from 'react-redux';
import { selectActiveChannelClaim, selectActiveChannelId } from 'redux/selectors/app';
import { selectMyChannelClaims } from 'redux/selectors/claims';
import { selectPublishFormValues } from 'redux/selectors/publish';
import { selectSettingsByChannelId } from 'redux/selectors/comments';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { doFetchCreatorSettings, doUpdateCreatorSettings } from 'redux/actions/comments';
import { doOpenModal } from 'redux/actions/app';
import { doToast } from 'redux/actions/notifications';
import PublishTemplateButton from './view';

const select = (state) => {
  const publishFormValues = selectPublishFormValues(state);
  const activeChannelId = selectActiveChannelId(state);
  const currentPublishChannelId = publishFormValues.channelId || activeChannelId;

  return {
    defaultChannelId: currentPublishChannelId,
    myChannelClaims: selectMyChannelClaims(state) || [],
    settingsByChannelId: selectSettingsByChannelId(state),
    activeChannelClaim: selectActiveChannelClaim(state),
    publishFormValues,
  };
};

const perform = {
  openModal: doOpenModal,
  updatePublishForm: doUpdatePublishForm,
  fetchCreatorSettings: doFetchCreatorSettings,
  doUpdateCreatorSettings,
  doToast,
};

export default connect(select, perform)(PublishTemplateButton);
