import { connect } from 'react-redux';
import { doEnterSettingsPage, doExitSettingsPage } from 'redux/actions/settings';
import { selectUserVerifiedEmail } from 'redux/selectors/user';

import SettingsPage from './view';

const select = (state) => ({
  isAuthenticated: selectUserVerifiedEmail(state),
});

const perform = {
  enterSettings: doEnterSettingsPage,
  exitSettings: doExitSettingsPage,
};

export default connect(select, perform)(SettingsPage);
