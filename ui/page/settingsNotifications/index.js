import { connect } from 'react-redux';
import { selectUserIsAuthenticated } from 'redux/selectors/user';
import NotificationSettingsPage from './view';

const select = (state) => ({
  isAuthenticated: selectUserIsAuthenticated(state),
});

export default connect(select)(NotificationSettingsPage);
