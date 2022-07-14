import { connect } from 'react-redux';
import { selectNotificationSettings } from 'redux/selectors/notifications';
import { doFetchNotificationSettings, doSetNotificationSettings } from 'redux/actions/notifications';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import SettingNotifications from './view';

const select = (state) => {
  const { claim_id: channelId, name: channelName } = selectActiveChannelClaim(state) || {};

  return {
    channelId,
    channelName,
    notificationSettings: selectNotificationSettings(state),
  };
};

const perform = {
  doFetchNotificationSettings,
  doSetNotificationSettings,
};

export default connect(select, perform)(SettingNotifications);
