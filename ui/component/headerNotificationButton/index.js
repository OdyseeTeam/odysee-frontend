import { connect } from 'react-redux';
import { selectNotifications, selectUnseenNotificationCount } from 'redux/selectors/notifications';
import { doReadNotifications, doSeeNotifications, doSeeAllNotifications } from 'redux/actions/notifications';
import { selectUser, selectUserVerifiedEmail } from 'redux/selectors/user';
import NotificationHeaderButton from './view';

const select = (state) => ({
  notifications: selectNotifications(state),
  unseenCount: selectUnseenNotificationCount(state),
  user: selectUser(state),
  authenticated: selectUserVerifiedEmail(state),
});

const perform = (dispatch, ownProps) => ({
  readNotification: (id) => dispatch(doReadNotifications(id)),
  seeNotification: (id) => dispatch(doSeeNotifications(id)),
  doSeeAllNotifications: doSeeAllNotifications,
  // deleteNotification: () => dispatch(doDeleteNotification(ownProps.notification.id)),
});

export default connect(select, perform)(NotificationHeaderButton);
