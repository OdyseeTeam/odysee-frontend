import { connect } from 'react-redux';
import {
  selectNotifications,
  selectIsFetchingNotifications,
  // selectUnseenNotificationCount,
} from 'redux/selectors/notifications';
import { selectScheduledLivestreamCount } from 'redux/selectors/calendar';
import { doSeeAllNotifications } from 'redux/actions/notifications';
import { selectUser } from 'redux/selectors/user';
import CalendarHeaderButton from './view';

const select = (state) => ({
  notifications: selectNotifications(state),
  fetching: selectIsFetchingNotifications(state),
  scheduledLivestreamCount: selectScheduledLivestreamCount(state),
  user: selectUser(state),
});

export default connect(select, {
  doSeeAllNotifications,
})(CalendarHeaderButton);
