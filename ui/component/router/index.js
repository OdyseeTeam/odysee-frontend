import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import * as PAGES from 'constants/pages';
import { selectUserVerifiedEmail, selectUser } from 'redux/selectors/user';
import { selectHasNavigated, selectScrollStartingPosition } from 'redux/selectors/app';
import { selectClientSetting, selectHomepageData, selectWildWestDisabled } from 'redux/selectors/settings';
import Router from './view';
import { selectTitleForUri, selectChannelPermanentUriForUri, selectClaimUriForId } from 'redux/selectors/claims';
import { doSetHasNavigated, doSetActiveChannel } from 'redux/actions/app';
import { doUserSetReferrerForUri } from 'redux/actions/user';
import { selectHasUnclaimedRefereeReward } from 'redux/selectors/rewards';
import { selectUnseenNotificationCount } from 'redux/selectors/notifications';
import { getPathForPage } from 'util/url';

const PLAYLIST_PATH = getPathForPage(PAGES.PLAYLIST);

const select = (state, props) => {
  const { uri: passedUri } = props;
  const { pathname } = state.router.location;

  // selects the proper claim uri for playlist given its page collectionId
  let uri = passedUri;
  if (pathname.startsWith(PLAYLIST_PATH)) {
    const collectionId = pathname.replace(PLAYLIST_PATH, '');
    uri = selectClaimUriForId(state, collectionId);
  }

  return {
    // passes down the same uri as passed in
    uri: passedUri,
    channelClaimPermanentUri: selectChannelPermanentUriForUri(state, uri),
    title: selectTitleForUri(state, uri),
    currentScroll: selectScrollStartingPosition(state),
    isAuthenticated: selectUserVerifiedEmail(state),
    isGlobalMod: Boolean(selectUser(state)?.global_mod),
    hasNavigated: selectHasNavigated(state),
    hasUnclaimedRefereeReward: selectHasUnclaimedRefereeReward(state),
    homepageData: selectHomepageData(state),
    wildWestDisabled: selectWildWestDisabled(state),
    unseenCount: selectUnseenNotificationCount(state),
    hideTitleNotificationCount: selectClientSetting(state, SETTINGS.HIDE_TITLE_NOTIFICATION_COUNT),
    hasDefaultChannel: Boolean(selectClientSetting(state, SETTINGS.ACTIVE_CHANNEL_CLAIM)),
  };
};

const perform = {
  setHasNavigated: doSetHasNavigated,
  doUserSetReferrerForUri,
  doSetActiveChannel,
};

export default connect(select, perform)(Router);
