import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import { doClearPlayingUri } from 'redux/actions/content';
import { doSetClientSetting } from 'redux/actions/settings';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectIsPlayerFloating } from 'redux/selectors/content';

import SettingPlayer from './view';

const select = (state, props) => ({
  floatingPlayer: selectClientSetting(state, SETTINGS.FLOATING_PLAYER),
  autoplayMedia: selectClientSetting(state, SETTINGS.AUTOPLAY_MEDIA),
  autoplayNext: selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT),
  disableShortsView: selectClientSetting(state, SETTINGS.DISABLE_SHORTS_VIEW),
  isFloating: selectIsPlayerFloating(state),
});

const perform = (dispatch) => ({
  setClientSetting: (key, value) => dispatch(doSetClientSetting(key, value)),
  clearPlayingUri: () => dispatch(doClearPlayingUri()),
});

export default connect(select, perform)(SettingPlayer);
