import { createSelector } from 'reselect';
import { SHOW_ADS } from 'config';
import { selectClaimForId, selectMyChannelClaims, selectStakedLevelForChannelUri } from 'redux/selectors/claims';
import { hasLegacyOdyseePremium, selectUserEmail, selectUserLocale } from 'redux/selectors/user';
import { selectDefaultChannelClaim } from 'redux/selectors/settings';

export const selectState = (state) => state.app || {};

export const selectPlatform = (state) => selectState(state).platform;

export const selectUpdateUrl = createSelector(selectPlatform, (platform) => {
  switch (platform) {
    case 'darwin':
      return 'https://lbry.com/get/lbry.dmg';
    case 'linux':
      return 'https://lbry.com/get/lbry.deb';
    case 'win32':
      return 'https://lbry.com/get/lbry.exe';
    default:
      throw Error('Unknown platform');
  }
});

export const selectHasClickedComment = (state) => selectState(state).hasClickedComment;
export const selectRemoteVersion = (state) => selectState(state).remoteVersion;
export const selectIsUpgradeAvailable = (state) => selectState(state).isUpgradeAvailable;

export const selectUpgradeFilename = createSelector(selectPlatform, selectRemoteVersion, (platform, version) => {
  switch (platform) {
    case 'darwin':
      return `LBRY_${version}.dmg`;
    case 'linux':
      return `LBRY_${version}.deb`;
    case 'win32':
      return `LBRY_${version}.exe`;
    default:
      throw Error('Unknown platform');
  }
});

export const selectDownloadProgress = (state) => selectState(state).downloadProgress;
export const selectDownloadComplete = (state) => selectState(state).upgradeDownloadCompleted;
export const selectIsUpgradeSkipped = (state) => selectState(state).isUpgradeSkipped;
export const selectUpgradeDownloadPath = (state) => selectState(state).downloadPath;
export const selectUpgradeDownloadItem = (state) => selectState(state).downloadItem;
export const selectAutoUpdateDownloaded = (state) => selectState(state).autoUpdateDownloaded;
export const selectAutoUpdateDeclined = (state) => selectState(state).autoUpdateDeclined;
export const selectDaemonVersionMatched = (state) => selectState(state).daemonVersionMatched;
export const selectVolume = (state) => selectState(state).volume;
export const selectMute = (state) => selectState(state).muted;
export const selectUpgradeTimer = (state) => selectState(state).checkUpgradeTimer;
const selectModalId = (state) => selectState(state).modal;
const selectModalProps = (state) => selectState(state).modalProps;

export const selectModal = createSelector(selectModalId, selectModalProps, (id, modalProps) => {
  return id ? { id, modalProps } : null;
});

export const selectSearchOptionsExpanded = (state) => selectState(state).searchOptionsExpanded;
export const selectWelcomeVersion = (state) => selectState(state).welcomeVersion;
export const selectHasNavigated = (state) => selectState(state).hasNavigated;
export const selectAllowAnalytics = (state) => selectState(state).allowAnalytics;
export const selectScrollStartingPosition = (state) => selectState(state).currentScroll;
export const selectIsPasswordSaved = (state) => selectState(state).isPasswordSaved;
export const selectInterestedInYoutubeSync = (state) => selectState(state).interestedInYoutubeSync;
export const selectSplashAnimationEnabled = (state) => selectState(state).splashAnimationEnabled;
export const selectActiveChannelId = (state) => selectState(state).activeChannel;

export const selectActiveChannelClaim = createSelector(
  (state) => selectClaimForId(state, selectActiveChannelId(state)), // i.e. 'byId[activeChannelId]' specifically, instead of just 'byId'.
  (state) => selectUserEmail(state),
  selectDefaultChannelClaim,
  selectMyChannelClaims,
  (activeChannelClaim, userEmail, defaultChannel, myChannelClaims) => {
    // Null: has none. Undefined: not resolved, default state, could have or not
    if (!userEmail || myChannelClaims === null) {
      return null;
    } else if (!myChannelClaims || !myChannelClaims.length) {
      return undefined;
    }

    if (activeChannelClaim) return activeChannelClaim;

    if (defaultChannel) return defaultChannel;

    const myChannelClaimsByEffectiveAmount = myChannelClaims.slice().sort((a, b) => {
      const effectiveAmountA = (a.meta && Number(a.meta.effective_amount)) || 0;
      const effectiveAmountB = (b.meta && Number(b.meta.effective_amount)) || 0;
      if (effectiveAmountA === effectiveAmountB) {
        return 0;
      } else if (effectiveAmountA > effectiveAmountB) {
        return -1;
      } else {
        return 1;
      }
    });

    return myChannelClaimsByEffectiveAmount[0];
  }
);

export const selectActiveChannelClaimId = (state) => {
  const activeChannelClaim = selectActiveChannelClaim(state);
  return activeChannelClaim && activeChannelClaim.claim_id;
};

export const selectActiveChannelStakedLevel = (state) => {
  const activeChannelClaim = selectActiveChannelClaim(state);
  if (!activeChannelClaim) {
    return 0;
  }

  const uri = activeChannelClaim.permanent_url;
  return selectStakedLevelForChannelUri(state, uri);
};

export const selectIncognito = (state) => selectState(state).incognito;

export const selectGdprConsentList = (state) => selectState(state).gdprConsentList;

// @flow
export const selectIsAdAllowedPerGdpr = (state) => {
  const locale: ?LocaleInfo = selectUserLocale(state);
  const list: Array<string> = selectGdprConsentList(state) || [];

  // --------------------------------------------------------------------------
  // C0001: Strictly necessary cookies -- the website needs these cookies in order to function properly (example: identify items placed into a shopping cart).
  // C0002: Performance cookies -- get information about how site visitors are using the website (example: Google analytics).
  // C0003: Functional cookies -- provide additional enhancement of the experience of site visitors (example: language selector for localization).
  // C0004: Targeting cookies -- cookies that attempt to gather more information about a user in order to personalize marketing (example: remarketing).
  // C0005: Social media cookies -- social media services added to the site that enable users to share content with their friends and networks easily.
  // STACK42: empirically determined ... not sure what it is, but seems to be tied to ads.
  // --------------------------------------------------------------------------

  // Don't allow ads until `locale` and gdpr is fetched/available.
  return locale && (!locale.gdpr_required || list.includes('STACK42') || list.includes('C0004'));
};

export const selectAdBlockerFound = (state) => selectState(state).adBlockerFound;

export const selectShouldShowAds = (state) => {
  return (
    SHOW_ADS &&
    selectAdBlockerFound(state) === false &&
    hasLegacyOdyseePremium(state) === false && // here
    selectIsAdAllowedPerGdpr(state)
  );
};

export const selectAppDrawerOpen = (state) => selectState(state).appDrawerOpen;
export const selectMainPlayerDimensions = (state) => selectState(state).mainPlayerDimensions;
export const selectVideoSourceLoaded = (state) => selectState(state).videoSourceLoaded;
export const selectHasAppDrawerOpen = (state) => Boolean(selectAppDrawerOpen(state));
export const selectAssignedLbrynetServer = (state) => selectState(state).assignedLbrynetServer;

export const selectIsDrawerOpenForType = (state, type) => {
  const appDrawerOpen = selectAppDrawerOpen(state);
  return appDrawerOpen === type;
};

export const selectVideoSourceLoadedForUri = (state, uri) => selectVideoSourceLoaded(state) === uri;
