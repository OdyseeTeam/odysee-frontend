import { connect } from 'react-redux';
import { selectNotificationSettings } from 'redux/selectors/notifications';
import { doFetchNotificationSettings, doSetNotificationSettings } from 'redux/actions/notifications';
import SettingNotifications from './view';

const select = (state) => ({
  notificationSettings: selectNotificationSettings(state),
});

const perform = {
  doFetchNotificationSettings,
  doSetNotificationSettings,
};

export default connect(select, perform)(SettingNotifications);
