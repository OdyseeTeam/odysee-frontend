// @flow
import * as PAGES from 'constants/pages';
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { lazyImport } from 'util/lazyImport';
import classnames from 'classnames';
import analytics from 'analytics';
import { setSearchUserId } from 'redux/actions/search';
import { buildURI, parseURI } from 'util/lbryURI';
import { SIMPLE_SITE } from 'config';
import Router from 'component/router/index';
import ModalRouter from 'modal/modalRouter';
import ReactModal from 'react-modal';
import { openContextMenu } from 'util/context-menu';
import useKonamiListener from 'util/enhanced-layout';
import Yrbl from 'component/yrbl';
import FileRenderFloating from 'component/fileRenderFloating';
import { withRouter } from 'react-router';
import usePrevious from 'effects/use-previous';
import Nag from 'component/common/nag';
import REWARDS from 'rewards';
import usePersistedState from 'effects/use-persisted-state';
import Spinner from 'component/spinner';
import LANGUAGES from 'constants/languages';
import YoutubeWelcome from 'web/component/youtubeReferralWelcome';
import {
  useDegradedPerformance,
  STATUS_OK,
  STATUS_DEGRADED,
  STATUS_FAILING,
  STATUS_DOWN,
} from 'web/effects/use-degraded-performance';
import LANGUAGE_MIGRATIONS from 'constants/language-migrations';

const FileDrop = lazyImport(() => import('component/fileDrop' /* webpackChunkName: "fileDrop" */));
const NagContinueFirstRun = lazyImport(() => import('component/nagContinueFirstRun' /* webpackChunkName: "nagCFR" */));
const OpenInAppLink = lazyImport(() => import('web/component/openInAppLink' /* webpackChunkName: "openInAppLink" */));
const NagDataCollection = lazyImport(() => import('web/component/nag-data-collection' /* webpackChunkName: "nagDC" */));
const NagDegradedPerformance = lazyImport(() =>
  import('web/component/nag-degraded-performance' /* webpackChunkName: "NagDegradedPerformance" */)
);
const NagNoUser = lazyImport(() => import('web/component/nag-no-user' /* webpackChunkName: "nag-no-user" */));
const NagSunset = lazyImport(() => import('web/component/nag-sunset' /* webpackChunkName: "nag-sunset" */));
const SyncFatalError = lazyImport(() => import('component/syncFatalError' /* webpackChunkName: "syncFatalError" */));

// ****************************************************************************

export const MAIN_WRAPPER_CLASS = 'main-wrapper';
export const IS_MAC = navigator.userAgent.indexOf('Mac OS X') !== -1;

const imaLibraryPath = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
const securePrivacyScriptUrl = 'https://app.secureprivacy.ai/script/6194129b66262906dd4a5f43.js';

type Props = {
  language: string,
  languages: Array<string>,
  theme: string,
  user: ?{ id: string, has_verified_email: boolean, is_reward_approved: boolean },
  location: { pathname: string, hash: string, search: string },
  history: { push: (string) => void },
  fetchAccessToken: () => void,
  fetchChannelListMine: () => void,
  fetchCollectionListMine: () => void,
  signIn: () => void,
  requestDownloadUpgrade: () => void,
  onSignedIn: () => void,
  setLanguage: (string) => void,
  isUpgradeAvailable: boolean,
  isReloadRequired: boolean,
  autoUpdateDownloaded: boolean,
  uploadCount: number,
  balance: ?number,
  syncError: ?string,
  syncEnabled: boolean,
  rewards: Array<Reward>,
  setReferrer: (string, boolean) => void,
  isAuthenticated: boolean,
  socketConnect: () => void,
  syncLoop: (?boolean) => void,
  currentModal: any,
  syncFatalError: boolean,
  activeChannelClaim: ?ChannelClaim,
  myChannelUrls: ?Array<string>,
  subscriptions: Array<Subscription>,
  setActiveChannelIfNotSet: () => void,
  setIncognito: (boolean) => void,
  fetchModBlockedList: () => void,
  resolveUris: (Array<string>) => void,
  fetchModAmIList: () => void,
};

function App(props: Props) {
  const {
    theme,
    user,
    fetchAccessToken,
    fetchChannelListMine,
    fetchCollectionListMine,
    signIn,
    autoUpdateDownloaded,
    isUpgradeAvailable,
    isReloadRequired,
    requestDownloadUpgrade,
    uploadCount,
    history,
    syncError,
    language,
    languages,
    setLanguage,
    rewards,
    setReferrer,
    isAuthenticated,
    syncLoop,
    currentModal,
    syncFatalError,
    myChannelUrls,
    activeChannelClaim,
    setActiveChannelIfNotSet,
    setIncognito,
    fetchModBlockedList,
    resolveUris,
    subscriptions,
    fetchModAmIList,
  } = props;

  const appRef = useRef();
  const isEnhancedLayout = useKonamiListener();
  const [hasSignedIn, setHasSignedIn] = useState(false);
  const hasVerifiedEmail = user && Boolean(user.has_verified_email);
  const isRewardApproved = user && user.is_reward_approved;
  const previousHasVerifiedEmail = usePrevious(hasVerifiedEmail);
  const previousRewardApproved = usePrevious(isRewardApproved);

  const [showAnalyticsNag, setShowAnalyticsNag] = usePersistedState('analytics-nag', true);
  const [lbryTvApiStatus, setLbryTvApiStatus] = useState(STATUS_OK);

  const { pathname, hash, search } = props.location;
  const [upgradeNagClosed, setUpgradeNagClosed] = useState(false);
  const [resolvedSubscriptions, setResolvedSubscriptions] = useState(false);
  const [retryingSync, setRetryingSync] = useState(false);
  const [sidebarOpen] = usePersistedState('sidebar', true);
  const [seenSunsestMessage, setSeenSunsetMessage] = usePersistedState('lbrytv-sunset', false);
  const showUpgradeButton =
    (autoUpdateDownloaded || (process.platform === 'linux' && isUpgradeAvailable)) && !upgradeNagClosed;
  // referral claiming
  const referredRewardAvailable = rewards && rewards.some((reward) => reward.reward_type === REWARDS.TYPE_REFEREE);
  const urlParams = new URLSearchParams(search);
  const rawReferrerParam = urlParams.get('r');
  const fromLbrytvParam = urlParams.get('sunset');
  const sanitizedReferrerParam = rawReferrerParam && rawReferrerParam.replace(':', '#');
  const shouldHideNag = pathname.startsWith(`/$/${PAGES.EMBED}`) || pathname.startsWith(`/$/${PAGES.AUTH_VERIFY}`);
  const userId = user && user.id;
  const useCustomScrollbar = !IS_MAC;
  const hasMyChannels = myChannelUrls && myChannelUrls.length > 0;
  const hasNoChannels = myChannelUrls && myChannelUrls.length === 0;
  const shouldMigrateLanguage = LANGUAGE_MIGRATIONS[language];
  const hasActiveChannelClaim = activeChannelClaim !== undefined;
  const isPersonalized = !IS_WEB || hasVerifiedEmail;
  const renderFiledrop = !IS_WEB || isAuthenticated;
  const isOnline = navigator.onLine;

  let uri;
  try {
    const newpath = buildURI(parseURI(pathname.slice(1).replace(/:/g, '#')));
    uri = newpath + hash;
  } catch (e) {}

  function handleAnalyticsDismiss() {
    setShowAnalyticsNag(false);
  }

  function getStatusNag() {
    // Handle "offline" first. Everything else is meaningless if it's offline.
    if (!isOnline) {
      return <Nag type="helpful" message={__('You are offline. Check your internet connection.')} />;
    }

    // Only 1 nag is possible, so show the most important:

    if (user === null) {
      return <NagNoUser />;
    }

    if (lbryTvApiStatus === STATUS_DEGRADED || lbryTvApiStatus === STATUS_FAILING) {
      if (!shouldHideNag) {
        return <NagDegradedPerformance onClose={() => setLbryTvApiStatus(STATUS_OK)} />;
      }
    }

    if (syncFatalError) {
      if (!retryingSync) {
        return (
          <Nag
            type="error"
            message={__('Failed to synchronize settings. Wait a while before retrying.')}
            actionText={__('Retry')}
            onClick={() => {
              syncLoop(true);
              setRetryingSync(true);
              setTimeout(() => setRetryingSync(false), 4000);
            }}
          />
        );
      }
    } else if (isReloadRequired) {
      return (
        <Nag
          message={__('A new version of Odysee is available.')}
          actionText={__('Refresh')}
          onClick={() => window.location.reload()}
        />
      );
    }
  }

  useEffect(() => {
    if (userId) {
      analytics.setUser(userId);
      setSearchUserId(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (!uploadCount) return;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = 'magic'; // without setting this to something it doesn't work
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploadCount]);

  // allows user to pause miniplayer using the spacebar without the page scrolling down
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    if (referredRewardAvailable && sanitizedReferrerParam && isRewardApproved) {
      setReferrer(sanitizedReferrerParam, true);
    } else if (referredRewardAvailable && sanitizedReferrerParam) {
      setReferrer(sanitizedReferrerParam, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sanitizedReferrerParam, isRewardApproved, referredRewardAvailable]);

  useEffect(() => {
    const { current: wrapperElement } = appRef;
    if (wrapperElement) {
      ReactModal.setAppElement(wrapperElement);
    }

    fetchAccessToken();

    // @if TARGET='app'
    fetchChannelListMine(); // This is fetched after a user is signed in on web
    fetchCollectionListMine();
    // @endif
  }, [appRef, fetchAccessToken, fetchChannelListMine, fetchCollectionListMine]);

  useEffect(() => {
    // $FlowFixMe
    document.documentElement.setAttribute('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (hasMyChannels && !hasActiveChannelClaim) {
      setActiveChannelIfNotSet();
    } else if (hasNoChannels) {
      setIncognito(true);
    }

    if (hasMyChannels) {
      fetchModBlockedList();
      fetchModAmIList();
    }
  }, [hasMyChannels, hasNoChannels, hasActiveChannelClaim, setActiveChannelIfNotSet, setIncognito]);

  useEffect(() => {
    // $FlowFixMe
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  useEffect(() => {
    if (!languages.includes(language)) {
      setLanguage(language);

      if (document && document.documentElement && LANGUAGES[language].length >= 3) {
        document.documentElement.dir = LANGUAGES[language][2];
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, languages]);

  useEffect(() => {
    if (shouldMigrateLanguage) {
      setLanguage(shouldMigrateLanguage);
    }
  }, [shouldMigrateLanguage, setLanguage]);

  useEffect(() => {
    // Check that previousHasVerifiedEmail was not undefined instead of just not truthy
    // This ensures we don't fire the emailVerified event on the initial user fetch
    if (previousHasVerifiedEmail === false && hasVerifiedEmail) {
      analytics.emailVerifiedEvent();
    }
  }, [previousHasVerifiedEmail, hasVerifiedEmail, signIn]);

  useEffect(() => {
    if (previousRewardApproved === false && isRewardApproved) {
      analytics.rewardEligibleEvent();
    }
  }, [previousRewardApproved, isRewardApproved]);

  // Load IMA3 SDK for aniview
  useEffect(() => {
    const script = document.createElement('script');
    script.src = imaLibraryPath;
    script.async = true;
    // $FlowFixMe
    document.body.appendChild(script);
    return () => {
      // $FlowFixMe
      document.body.removeChild(script);
    };
  }, []);

  // add secure privacy script
  useEffect(() => {
    function inIframe() {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    }

    if (inIframe()) {
      return;
    }

    const script = document.createElement('script');
    script.src = securePrivacyScriptUrl;
    script.async = true;
    // might use this for future checking to prevent doubleloading
    script.id = 'securePrivacy';

    const cmpScript = document.createElement('script');
    cmpScript.src = 'https://app.secureprivacy.ai/secureprivacy-plugin/web-plugin/cmp/cmp-v2.js';
    cmpScript.async = true;

    const getLocaleEndpoint = 'https://api.odysee.com/locale/get';
    let gdprRequired;
    try {
      gdprRequired = localStorage.getItem('gdprRequired');
    } catch (err) {
      if (err) return;
    }
    // gdpr is known to be required, add script
    if (gdprRequired === 'true') {
      // $FlowFixMe
      document.head.appendChild(script);
      // $FlowFixMe
      document.head.appendChild(cmpScript);
    }

    // haven't done a gdpr check, do it now
    if (gdprRequired === null) {
      (async function () {
        const response = await fetch(getLocaleEndpoint);
        const json = await response.json();
        const gdprRequiredBasedOnLocation = json.data.gdpr_required;
        // note we need gdpr and load script
        if (gdprRequiredBasedOnLocation) {
          localStorage.setItem('gdprRequired', 'true');
          // $FlowFixMe
          document.head.appendChild(script);
          // $FlowFixMe
          document.head.appendChild(cmpScript);
          // note we don't need gdpr, save to session
        } else if (gdprRequiredBasedOnLocation === false) {
          localStorage.setItem('gdprRequired', 'false');
        }
      })();
    }

    return () => {
      // $FlowFixMe
      document.head.removeChild(script);
      // $FlowFixMe
      document.head.appendChild(cmpScript);
    };
  }, []);

  // ready for sync syncs, however after signin when hasVerifiedEmail, that syncs too.
  useEffect(() => {
    // signInSyncPref is cleared after sharedState loop.
    const syncLoopWithoutInterval = () => syncLoop(true);
    if (hasSignedIn && hasVerifiedEmail) {
      // In case we are syncing.
      syncLoop();
      window.addEventListener('focus', syncLoopWithoutInterval);
    }
    return () => {
      window.removeEventListener('focus', syncLoopWithoutInterval);
    };
  }, [hasSignedIn, hasVerifiedEmail, syncLoop]);

  useEffect(() => {
    if (syncError && isAuthenticated && !pathname.includes(PAGES.AUTH_WALLET_PASSWORD) && !currentModal) {
      history.push(`/$/${PAGES.AUTH_WALLET_PASSWORD}?redirect=${pathname}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncError, pathname, isAuthenticated]);

  // Keep this at the end to ensure initial setup effects are run first
  useEffect(() => {
    if (!hasSignedIn && hasVerifiedEmail) {
      signIn();
      setHasSignedIn(true);
    }
  }, [hasVerifiedEmail, signIn, hasSignedIn]);

  // batch resolve subscriptions to be used by the sideNavigation component.
  // add it here so that it only resolves the first time, despite route changes.
  // useLayoutEffect because it has to be executed before the sideNavigation component requests them
  useLayoutEffect(() => {
    if (sidebarOpen && isPersonalized && subscriptions && !resolvedSubscriptions) {
      setResolvedSubscriptions(true);
      resolveUris(subscriptions.map((sub) => sub.uri));
    }
  }, [sidebarOpen, isPersonalized, resolvedSubscriptions, subscriptions, resolveUris, setResolvedSubscriptions]);

  useDegradedPerformance(setLbryTvApiStatus, user);

  // Require an internal-api user on lbry.tv
  // This also prevents the site from loading in the un-authed state while we wait for internal-apis to return for the first time
  // It's not needed on desktop since there is no un-authed state
  if (user === undefined) {
    return (
      <div className="main--empty">
        <Spinner delayed />
      </div>
    );
  }

  if (isOnline && lbryTvApiStatus === STATUS_DOWN) {
    // TODO: Rename `SyncFatalError` since it has nothing to do with syncing.
    return (
      <React.Suspense fallback={null}>
        <SyncFatalError lbryTvApiStatus={lbryTvApiStatus} />
      </React.Suspense>
    );
  }

  return (
    <div
      className={classnames(MAIN_WRAPPER_CLASS, {
        // @if TARGET='app'
        [`${MAIN_WRAPPER_CLASS}--mac`]: IS_MAC,
        // @endif
        [`${MAIN_WRAPPER_CLASS}--scrollbar`]: useCustomScrollbar,
      })}
      ref={appRef}
      onContextMenu={IS_WEB ? undefined : (e) => openContextMenu(e)}
    >
      {IS_WEB && lbryTvApiStatus === STATUS_DOWN ? (
        <Yrbl
          className="main--empty"
          title={__('odysee.com is currently down')}
          subtitle={__('My wheel broke, but the good news is that someone from LBRY is working on it.')}
        />
      ) : (
        <React.Fragment>
          <Router />
          <ModalRouter />
          <React.Suspense fallback={null}>{renderFiledrop && <FileDrop />}</React.Suspense>
          <FileRenderFloating />
          <React.Suspense fallback={null}>
            {isEnhancedLayout && <Yrbl className="yrbl--enhanced" />}

            {/* @if TARGET='app' */}
            {showUpgradeButton && (
              <Nag
                message={__('An upgrade is available.')}
                actionText={__('Install Now')}
                onClick={requestDownloadUpgrade}
                onClose={() => setUpgradeNagClosed(true)}
              />
            )}
            {/* @endif */}

            <YoutubeWelcome />
            {!SIMPLE_SITE && !shouldHideNag && <OpenInAppLink uri={uri} />}
            {!shouldHideNag && <NagContinueFirstRun />}
            {fromLbrytvParam && !seenSunsestMessage && !shouldHideNag && (
              <NagSunset email={hasVerifiedEmail} onClose={() => setSeenSunsetMessage(true)} />
            )}
            {!SIMPLE_SITE && lbryTvApiStatus === STATUS_OK && showAnalyticsNag && !shouldHideNag && (
              <NagDataCollection onClose={handleAnalyticsDismiss} />
            )}
            {getStatusNag()}
          </React.Suspense>
        </React.Fragment>
      )}
    </div>
  );
}

export default withRouter(App);
