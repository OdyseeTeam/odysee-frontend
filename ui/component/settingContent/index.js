import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import { doOpenModal } from 'redux/actions/app';
import { doClearPlayingUri } from 'redux/actions/content';
import { doSetClientSetting } from 'redux/actions/settings';
import { selectShowMatureContent, selectClientSetting } from 'redux/selectors/settings';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { makeSelectIsPlayerFloating } from 'redux/selectors/content';
import { withRouter } from 'react-router';

import SettingContent from './view';

const select = (state, props) => ({
  isAuthenticated: selectUserVerifiedEmail(state),
  floatingPlayer: selectClientSetting(state, SETTINGS.FLOATING_PLAYER),
  autoplayMedia: selectClientSetting(state, SETTINGS.AUTOPLAY_MEDIA),
  autoplayNext: selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT),
  hideMembersOnlyContent: selectClientSetting(state, SETTINGS.HIDE_MEMBERS_ONLY_CONTENT),
  hideReposts: selectClientSetting(state, SETTINGS.HIDE_REPOSTS),
  hideScheduledLivestreams: selectClientSetting(state, SETTINGS.HIDE_SCHEDULED_LIVESTREAMS),
  showNsfw: selectShowMatureContent(state),
  instantPurchaseEnabled: selectClientSetting(state, SETTINGS.INSTANT_PURCHASE_ENABLED),
  instantPurchaseMax: selectClientSetting(state, SETTINGS.INSTANT_PURCHASE_MAX),
  enablePublishPreview: selectClientSetting(state, SETTINGS.ENABLE_PUBLISH_PREVIEW),
  isFloating: makeSelectIsPlayerFloating(props.location)(state),
});

const perform = (dispatch) => ({
  setClientSetting: (key, value) => dispatch(doSetClientSetting(key, value)),
  clearPlayingUri: () => dispatch(doClearPlayingUri()),
  openModal: (id, params) => dispatch(doOpenModal(id, params)),
});

export default withRouter(connect(select, perform)(SettingContent));
