import { connect } from 'react-redux';
import { selectNotificationSettings } from 'redux/selectors/notifications';
import {
  doFetchNotificationSettings,
  doToggleNotificationsDisabled,
  doToggleFollowerNotifications,
  doToggleFollowedNotifications,
} from 'redux/actions/notifications';
import SettingNotifications from './view';

const select = (state) => ({
  notificationSettings: selectNotificationSettings(state),
});

const perform = {
  doFetchNotificationSettings,
  doToggleNotificationsDisabled,
  doToggleFollowerNotifications,
  doToggleFollowedNotifications,
};

export default connect(select, perform)(SettingNotifications);
