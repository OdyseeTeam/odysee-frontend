import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import { doOpenModal } from 'redux/actions/app';
import { doSetClientSetting } from 'redux/actions/settings';
import { selectShowMatureContent, selectClientSetting } from 'redux/selectors/settings';
import { selectUserVerifiedEmail } from 'redux/selectors/user';

import SettingContent from './view';

const select = (state, props) => ({
  isAuthenticated: selectUserVerifiedEmail(state),
  hideMembersOnlyContent: selectClientSetting(state, SETTINGS.HIDE_MEMBERS_ONLY_CONTENT),
  hideReposts: selectClientSetting(state, SETTINGS.HIDE_REPOSTS),
  hideShorts: selectClientSetting(state, SETTINGS.HIDE_SHORTS),
  defaultCollectionAction: selectClientSetting(state, SETTINGS.DEFAULT_COLLECTION_ACTION),
  showNsfw: selectShowMatureContent(state),
  instantPurchaseEnabled: selectClientSetting(state, SETTINGS.INSTANT_PURCHASE_ENABLED),
  instantPurchaseMax: selectClientSetting(state, SETTINGS.INSTANT_PURCHASE_MAX),
  enablePublishPreview: selectClientSetting(state, SETTINGS.ENABLE_PUBLISH_PREVIEW),
});

const perform = (dispatch) => ({
  setClientSetting: (key, value) => dispatch(doSetClientSetting(key, value)),
  openModal: (id, params) => dispatch(doOpenModal(id, params)),
});

export default connect(select, perform)(SettingContent);
