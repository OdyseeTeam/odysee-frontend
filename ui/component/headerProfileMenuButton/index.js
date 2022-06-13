import { connect } from 'react-redux';
import { doSignOut } from 'redux/actions/app';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectMyChannelClaimIds } from 'redux/selectors/claims';
import { selectUserEmail, selectUserVerifiedEmail } from 'redux/selectors/user';
import { selectClientSetting } from 'redux/selectors/settings';
import { doSetClientSetting } from 'redux/actions/settings';
import * as SETTINGS from 'constants/settings';

import HeaderProfileMenuButton from './view';

const select = (state) => ({
  currentTheme: selectClientSetting(state, SETTINGS.THEME),
  automaticDarkModeEnabled: selectClientSetting(state, SETTINGS.AUTOMATIC_DARK_MODE_ENABLED),

  myChannelClaimIds: selectMyChannelClaimIds(state),
  activeChannelClaim: selectActiveChannelClaim(state),
  authenticated: selectUserVerifiedEmail(state),
  email: selectUserEmail(state),
});

const perform = (dispatch) => ({
  handleThemeToggle: (automaticDarkModeEnabled, currentTheme) => {
    if (automaticDarkModeEnabled) dispatch(doSetClientSetting(SETTINGS.AUTOMATIC_DARK_MODE_ENABLED, false));
    dispatch(doSetClientSetting(SETTINGS.THEME, currentTheme === 'dark' ? 'light' : 'dark', true));
  },
  signOut: doSignOut,
  // doOpenModal: (id, params) => dispatch(doOpenModal(id, params)),
});

/*
const perform = {
  signOut: doSignOut,
};
*/

export default connect(select, perform)(HeaderProfileMenuButton);
