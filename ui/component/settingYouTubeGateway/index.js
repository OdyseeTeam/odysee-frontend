import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import { doSetClientSetting } from 'redux/actions/settings';
import { doToast } from 'redux/actions/notifications';
import { selectClientSetting } from 'redux/selectors/settings';

import SettingYouTubeGateway from './view';

const select = (state) => ({
  gatewayUrl: selectClientSetting(state, SETTINGS.YOUTUBE_GATEWAY_URL),
  gatewayToken: selectClientSetting(state, SETTINGS.YOUTUBE_GATEWAY_TOKEN),
});

const perform = (dispatch) => ({
  setClientSetting: (key, value, pushPrefs) => dispatch(doSetClientSetting(key, value, pushPrefs)),
  doToast: (params) => dispatch(doToast(params)),
});

export default connect(select, perform)(SettingYouTubeGateway);
