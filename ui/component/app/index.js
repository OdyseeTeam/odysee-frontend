import { hot } from 'react-hot-loader/root';
import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import {
  selectGetSyncErrorMessage,
  selectPrefsReady,
  selectSyncFatalError,
  selectSyncIsLocked,
} from 'redux/selectors/sync';
import { doUserSetReferrerForUri } from 'redux/actions/user';
import { doSetLastViewedAnnouncement } from 'redux/actions/content';
import { selectUser, selectUserLocale, selectUserVerifiedEmail } from 'redux/selectors/user';
import { selectUnclaimedRewards } from 'redux/selectors/rewards';
import { selectMyChannelClaimIds } from 'redux/selectors/claims';
import {
  selectLanguage,
  selectLoadedLanguages,
  selectThemePath,
  selectDefaultChannelClaim,
  selectHomepageAnnouncement,
  selectClientSetting,
} from 'redux/selectors/settings';
import { selectModal, selectActiveChannelClaim } from 'redux/selectors/app';
import { selectUploadCount } from 'redux/selectors/publish';
import { selectPersonalRecommendations } from 'redux/selectors/search';
import {
  doOpenAnnouncements,
  doSetLanguage,
  doSetDefaultChannel,
  doFetchLanguage,
  doSetClientSetting,
} from 'redux/actions/settings';
import { doSyncLoop } from 'redux/actions/sync';
import { doSignIn, doSetIncognito, doSetAssignedLbrynetServer, doOpenModal } from 'redux/actions/app';
import { doFetchModBlockedList, doFetchCommentModAmIList } from 'redux/actions/comments';
import App from './view';

const select = (state) => ({
  user: selectUser(state),
  locale: selectUserLocale(state),
  theme: selectThemePath(state),
  language: selectLanguage(state),
  languages: selectLoadedLanguages(state),
  reloadRequired: state.app.reloadRequired,
  prefsReady: selectPrefsReady(state),
  syncError: selectGetSyncErrorMessage(state),
  syncIsLocked: selectSyncIsLocked(state),
  uploadCount: selectUploadCount(state),
  rewards: selectUnclaimedRewards(state),
  isAuthenticated: selectUserVerifiedEmail(state),
  currentModal: selectModal(state),
  syncFatalError: selectSyncFatalError(state),
  activeChannelClaim: selectActiveChannelClaim(state),
  myChannelClaimIds: selectMyChannelClaimIds(state),
  defaultChannelClaim: selectDefaultChannelClaim(state),
  announcement: selectHomepageAnnouncement(state),
  homepageOrder: selectClientSetting(state, SETTINGS.HOMEPAGE_ORDER),
  isFypModalShown: selectClientSetting(state, SETTINGS.FYP_MODAL_SHOWN),
  personalRecommendations: selectPersonalRecommendations(state),
});

const perform = {
  setLanguage: doSetLanguage,
  fetchLanguage: doFetchLanguage,
  signIn: doSignIn,
  syncLoop: doSyncLoop,
  doUserSetReferrerForUri,
  setIncognito: doSetIncognito,
  fetchModBlockedList: doFetchModBlockedList,
  fetchModAmIList: doFetchCommentModAmIList,
  doOpenAnnouncements,
  doSetLastViewedAnnouncement,
  doSetDefaultChannel,
  doSetAssignedLbrynetServer,
  doOpenModal,
  doSetClientSetting,
};

export default hot(connect(select, perform)(App));
