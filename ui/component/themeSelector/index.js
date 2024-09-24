import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import { doSetClientSetting, doSetDarkTime } from 'redux/actions/settings';
import { selectClientSetting } from 'redux/selectors/settings';
import ThemeSelector from './view';

const select = (state) => ({
  currentTheme: selectClientSetting(state, SETTINGS.THEME),
  // Temporarily hardcoding themes here, otherwise user needs to log out and reload to get the changes in clientSettings. Can be removed after sometime, when most users have done that.
  themes: [__('dark'), __('light'), __('system')], // selectClientSetting(state, SETTINGS.THEMES),
  automaticDarkModeEnabled: selectClientSetting(state, SETTINGS.AUTOMATIC_DARK_MODE_ENABLED),
  darkModeTimes: selectClientSetting(state, SETTINGS.DARK_MODE_TIMES),
  clock24h: selectClientSetting(state, SETTINGS.CLOCK_24H),
});

const perform = (dispatch) => ({
  setClientSetting: (key, value) => dispatch(doSetClientSetting(key, value)),
  setDarkTime: (time, options) => dispatch(doSetDarkTime(time, options)),
});

export default connect(select, perform)(ThemeSelector);
