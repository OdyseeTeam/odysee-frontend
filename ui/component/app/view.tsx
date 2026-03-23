import * as PAGES from 'constants/pages';
import * as MODALS from 'constants/modal_types';
import * as SETTINGS from 'constants/settings';
import React, { useEffect, useState } from 'react';
import { AppContext } from 'contexts/app';
export { AppContext };
import { lazyImport } from 'util/lazyImport';
import { tusUnlockAndNotify, tusHandleTabUpdates } from 'util/tus';
import analytics from 'analytics';
import { setSearchUserId } from 'redux/actions/search';
import { parseURI, buildURI } from 'util/lbryURI';
import { generateGoogleCacheUrl } from 'util/url';
import Router from 'component/router/index';
import ReactModal from 'react-modal';
import useKonamiListener from 'util/enhanced-layout';
import Yrbl from 'component/yrbl';
import usePrevious from 'effects/use-previous';
import Nag from 'component/nag';
import Wander from 'component/wander';
import REWARDS from 'rewards';
import usePersistedState from 'effects/use-persisted-state';
import useConnectionStatus from 'effects/use-connection-status';
import Spinner from 'component/spinner';
import LANGUAGES from 'constants/languages';
import { BeforeUnload, Unload } from 'util/beforeUnload';
import { platform } from 'util/platform';
import YoutubeWelcome from 'web/component/youtubeReferralWelcome';
import {
  useDegradedPerformance,
  STATUS_OK,
  STATUS_DEGRADED,
  STATUS_FAILING,
  STATUS_DOWN,
} from 'web/effects/use-degraded-performance';
import LANGUAGE_MIGRATIONS from 'constants/language-migrations';
import { useIsMobile } from 'effects/use-screensize';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
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
import { doToast } from 'redux/actions/notifications';
import { doSyncLoop } from 'redux/actions/sync';
import { doSignIn, doSetIncognito, doSetAssignedLbrynetServer, doOpenModal } from 'redux/actions/app';
import {
  doFetchModBlockedList,
  doFetchCommentModAmIList,
  doCommentModListDelegatesForMyChannels,
} from 'redux/actions/comments';
const DebugLog = lazyImport(
  () =>
    import(
      'component/debugLog'
      /* webpackChunkName: "debugLog" */
    )
);
const FileDrop = lazyImport(
  () =>
    import(
      'component/fileDrop'
      /* webpackChunkName: "fileDrop" */
    )
);
const NagContinueFirstRun = lazyImport(
  () =>
    import(
      'component/nagContinueFirstRun'
      /* webpackChunkName: "nagCFR" */
    )
);
const NagDegradedPerformance = lazyImport(
  () =>
    import(
      'web/component/nag-degraded-performance'
      /* webpackChunkName: "NagDegradedPerformance" */
    )
);
const NagNoUser = lazyImport(
  () =>
    import(
      'web/component/nag-no-user'
      /* webpackChunkName: "nag-no-user" */
    )
);
const NagSunset = lazyImport(
  () =>
    import(
      'web/component/nag-sunset'
      /* webpackChunkName: "nag-sunset" */
    )
);
const SyncFatalError = lazyImport(
  () =>
    import(
      'component/syncFatalError'
      /* webpackChunkName: "syncFatalError" */
    )
);
const ModalRouter = lazyImport(
  () =>
    import(
      'modal/modalRouter'
      /* webpackChunkName: "modalRouter" */
    )
);
const VideoRenderFloating = lazyImport(
  () =>
    import(
      'component/videoRenderFloating'
      /* webpackChunkName: "videoRenderFloating" */
    )
);
// ****************************************************************************
export const MAIN_WRAPPER_CLASS = 'main-wrapper';
export const IS_MAC = navigator.userAgent.indexOf('Mac OS X') !== -1;
// const imaLibraryPath = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
const oneTrustScriptSrc = 'https://cdn.cookielaw.org/scripttemplates/otSDKStub.js';
const LATEST_PATH = `/$/${PAGES.LATEST}/`;
const LIVE_PATH = `/$/${PAGES.LIVE_NOW}/`;
const EMBED_PATH = `/$/${PAGES.EMBED}/`;
type HomepageOrder = {
  active: Array<string> | null | undefined;
  hidden: Array<string> | null | undefined;
};

function App() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const locale = useAppSelector(selectUserLocale);
  const theme = useAppSelector(selectThemePath);
  const language = useAppSelector(selectLanguage);
  const languages = useAppSelector(selectLoadedLanguages);
  const reloadRequired = useAppSelector((state) => state.app.reloadRequired);
  const prefsReady = useAppSelector(selectPrefsReady);
  const syncError = useAppSelector(selectGetSyncErrorMessage);
  const syncIsLocked = useAppSelector(selectSyncIsLocked);
  const uploadCount = useAppSelector(selectUploadCount);
  const rewards = useAppSelector(selectUnclaimedRewards);
  const isAuthenticated = useAppSelector(selectUserVerifiedEmail);
  const currentModal = useAppSelector(selectModal);
  const syncFatalError = useAppSelector(selectSyncFatalError);
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  const myChannelClaimIds = useAppSelector(selectMyChannelClaimIds);
  const defaultChannelClaim = useAppSelector(selectDefaultChannelClaim);
  const announcement = useAppSelector(selectHomepageAnnouncement);
  const homepageOrder = useAppSelector((state) => selectClientSetting(state, SETTINGS.HOMEPAGE_ORDER)) as HomepageOrder;
  const isFypModalShown = useAppSelector((state) => selectClientSetting(state, SETTINGS.FYP_MODAL_SHOWN));
  const personalRecommendations = useAppSelector(selectPersonalRecommendations);

  const signIn = (...args: Parameters<typeof doSignIn>) => dispatch(doSignIn(...args));
  const setLanguage = (...args: Parameters<typeof doSetLanguage>) => dispatch(doSetLanguage(...args));
  const fetchLanguage = (...args: Parameters<typeof doFetchLanguage>) => dispatch(doFetchLanguage(...args));
  const syncLoop = (...args: Parameters<typeof doSyncLoop>) => dispatch(doSyncLoop(...args));
  const setIncognito = (...args: Parameters<typeof doSetIncognito>) => dispatch(doSetIncognito(...args));
  const fetchModBlockedList = () => dispatch(doFetchModBlockedList());
  const fetchModAmIList = () => dispatch(doFetchCommentModAmIList());
  const fetchDelegatesForMyChannels = () => dispatch(doCommentModListDelegatesForMyChannels());
  const doUserSetReferrerForUri_ = (...args: Parameters<typeof doUserSetReferrerForUri>) =>
    dispatch(doUserSetReferrerForUri(...args));
  const doOpenAnnouncements_ = () => dispatch(doOpenAnnouncements());
  const doSetLastViewedAnnouncement_ = (...args: Parameters<typeof doSetLastViewedAnnouncement>) =>
    dispatch(doSetLastViewedAnnouncement(...args));
  const doSetDefaultChannel_ = (...args: Parameters<typeof doSetDefaultChannel>) =>
    dispatch(doSetDefaultChannel(...args));
  const doSetAssignedLbrynetServer_ = (...args: Parameters<typeof doSetAssignedLbrynetServer>) =>
    dispatch(doSetAssignedLbrynetServer(...args));
  const doOpenModal_ = (...args: Parameters<typeof doOpenModal>) => dispatch(doOpenModal(...args));
  const doSetClientSetting_ = (...args: Parameters<typeof doSetClientSetting>) => dispatch(doSetClientSetting(...args));
  const doToast_ = (...args: Parameters<typeof doToast>) => dispatch(doToast(...args));
  const isMobile = useIsMobile();
  const isEnhancedLayout = useKonamiListener();
  const [hasSignedIn, setHasSignedIn] = useState(false);
  const hasVerifiedEmail = user && Boolean(user.has_verified_email);
  const isRewardApproved = user && user.is_reward_approved;
  const previousHasVerifiedEmail = usePrevious(hasVerifiedEmail);
  const previousRewardApproved = usePrevious(isRewardApproved);
  const [lbryTvApiStatus, setLbryTvApiStatus] = useState(STATUS_OK);
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname, hash, search } = location;
  const [retryingSync, setRetryingSync] = useState(false);
  const [langRenderKey, setLangRenderKey] = useState(0);
  const [seenSunsestMessage, setSeenSunsetMessage] = usePersistedState('lbrytv-sunset', false);
  // referral claiming
  const referredRewardAvailable = rewards && rewards.some((reward) => reward.reward_type === REWARDS.TYPE_REFEREE);
  const urlParams = new URLSearchParams(search);
  const rawReferrerParam = urlParams.get('r');
  const fromLbrytvParam = urlParams.get('sunset');
  const sanitizedReferrerParam = rawReferrerParam && rawReferrerParam.replace(':', '#');
  const embedPath = pathname.startsWith(EMBED_PATH);
  const shouldHideNag = embedPath || pathname.startsWith(`/$/${PAGES.AUTH_VERIFY}`);
  const userId = user && user.id;
  const hasMyChannels = myChannelClaimIds && myChannelClaimIds.length > 0;
  const hasNoChannels = myChannelClaimIds && myChannelClaimIds.length === 0;
  const shouldMigrateLanguage = LANGUAGE_MIGRATIONS[language];
  const renderFiledrop = !isMobile && isAuthenticated && !platform.isFirefox();
  const useDebugLog = process.env.NODE_ENV !== 'production' || process.env.IS_TEST_INSTANCE === 'true';
  const connectionStatus = useConnectionStatus();
  const urlPath = pathname + hash;
  const latestContentPath = urlPath.startsWith(LATEST_PATH);
  const liveContentPath = urlPath.startsWith(LIVE_PATH);
  const featureParam = urlParams.get('feature');
  const embedLatestPath = embedPath && (featureParam === PAGES.LATEST || featureParam === PAGES.LIVE_NOW);
  const isNewestPath = latestContentPath || liveContentPath || embedLatestPath;
  let path;

  if (isNewestPath) {
    path = urlPath.replace(embedLatestPath ? EMBED_PATH : latestContentPath ? LATEST_PATH : LIVE_PATH, '');
  } else {
    // Remove the leading "/" added by the browser
    path = urlPath.slice(1);
  }

  path = path.replace(/:/g, '#');

  if (isNewestPath && !path.startsWith('@')) {
    path = `@${path}`;
  }

  if (search && search.startsWith('?q=cache:')) {
    generateGoogleCacheUrl(search, path);
  }

  let uri;

  try {
    // here queryString and startTime are "removed" from the buildURI process
    // to build only the uri itself
    const { queryString, startTime, ...parsedUri } = parseURI(path);
    uri = buildURI({ ...parsedUri }, true);
  } catch (e) {
    const match = path.match(/[#/:]/);

    if (!path.startsWith('$/') && match && match.index) {
      uri = `lbry://${path.slice(0, match.index)}`;
    } else if (path.startsWith(`$/${PAGES.EMBED}/`)) {
      uri = `lbry://${path.replace(`$/${PAGES.EMBED}/`, '')}`;
    }
  }

  function getStatusNag() {
    // Handle "offline" first. Everything else is meaningless if it's offline.
    if (!connectionStatus.online) {
      return <Nag type="helpful" message={__('You are offline. Check your internet connection.')} />;
    }

    // Only 1 nag is possible, so show the most important:
    // Active uploads warning (show globally so users know why the browser prompts on leave)
    if (uploadCount > 0 && !embedPath) {
      const uploadPathname = location && location.pathname;
      const onUploadPage =
        (uploadPathname && uploadPathname.startsWith(`/$/${PAGES.UPLOAD}`)) ||
        (uploadPathname && uploadPathname.startsWith(`/$/${PAGES.UPLOADS}`));

      if (!onUploadPage) {
        return (
          <Nag
            type="helpful"
            message={__('Upload in progress. Closing or reloading may interrupt your upload.')}
            actionText={__('View Uploads')}
            onClick={() => navigate(`/$/${PAGES.UPLOADS}`)}
          />
        );
      }
    }

    if (user === null && !embedPath) {
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
    } else if (reloadRequired) {
      const msg =
        reloadRequired === 'newVersionFound' ? 'A new version of Odysee is available.' : 'Oops! Something went wrong.';
      assert(reloadRequired === 'newVersionFound' || reloadRequired === 'lazyImportFailed');
      return <Nag message={__(msg)} actionText={__('Refresh')} onClick={() => window.location.reload()} />;
    }
  }

  useEffect(() => {
    if (userId) {
      analytics.setUser(userId);
      setSearchUserId(userId);
    }
  }, [userId]);
  useEffect(() => {
    if (syncIsLocked) {
      const msg = 'There are unsaved settings. Exit the Settings Page to finalize them.';

      const handleBeforeUnload = (event) => {
        event.preventDefault();
        event.returnValue = msg;
      };

      BeforeUnload.register(handleBeforeUnload, msg);
      return () => BeforeUnload.unregister(handleBeforeUnload);
    }
  }, [syncIsLocked]);
  useEffect(() => {
    if (!uploadCount) return;
    const msg = 'Unfinished uploads.';

    const handleUnload = () => tusUnlockAndNotify();

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = __(msg); // without setting this to something it doesn't work in some browsers.
    };

    Unload.register(handleUnload);
    BeforeUnload.register(handleBeforeUnload, msg);
    return () => {
      Unload.unregister(handleUnload);
      BeforeUnload.unregister(handleBeforeUnload);
    };
  }, [uploadCount]);
  useEffect(() => {
    if (!uploadCount) return;

    const onStorageUpdate = (e) => tusHandleTabUpdates(e.key);

    window.addEventListener('storage', onStorageUpdate);
    return () => window.removeEventListener('storage', onStorageUpdate);
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
    if (referredRewardAvailable && sanitizedReferrerParam) {
      doUserSetReferrerForUri_(sanitizedReferrerParam);
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sanitizedReferrerParam, referredRewardAvailable]);
  useEffect(() => {
    document.documentElement.setAttribute('theme', theme);
  }, [theme]);
  useEffect(() => {
    if (hasNoChannels) {
      setIncognito(true);
    }

    if (hasMyChannels) {
      fetchModBlockedList();
      fetchModAmIList();
      fetchDelegatesForMyChannels();
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMyChannels, hasNoChannels, setIncognito]);
  useEffect(() => {
    if (hasMyChannels && activeChannelClaim && !defaultChannelClaim && prefsReady) {
      doSetDefaultChannel_(activeChannelClaim.claim_id);
    }
  }, [activeChannelClaim, defaultChannelClaim, doSetDefaultChannel_, hasMyChannels, prefsReady]);
  useEffect(() => {
    if (
      isFypModalShown ||
      !prefsReady ||
      homepageOrder.active?.includes('FYP') ||
      homepageOrder.hidden?.includes('FYP') ||
      !personalRecommendations.uris.length
    ) {
      return;
    }

    doOpenModal_(MODALS.CONFIRM, {
      title: __('Homepage recommendations available'),
      subtitle: __(
        'Would you like to enable them? Homepage recommendations placement can be configured from the homepage customization.'
      ),
      labelOk: __('Yes!'),
      labelCancel: __('Later'),
      onConfirm: (closeModal) => {
        closeModal();
        const active = homepageOrder?.active || [];
        const newHomePageOrder = { ...homepageOrder, active: ['FYP', ...active] };
        doSetClientSetting_(SETTINGS.HOMEPAGE_ORDER, newHomePageOrder, true);
        doSetClientSetting_(SETTINGS.FYP_MODAL_SHOWN, true, true);
        doToast_({
          message: __('Homepage recommendations enabled.'),
        });
      },
      onCancel: (closeModal) => {
        closeModal();
        const hidden = homepageOrder?.hidden || [];
        const newHomePageOrder = { ...homepageOrder, hidden: hidden.includes('FYP') ? hidden : ['FYP', ...hidden] };
        doSetClientSetting_(SETTINGS.HOMEPAGE_ORDER, newHomePageOrder, true);
        doSetClientSetting_(SETTINGS.FYP_MODAL_SHOWN, true, true);
      },
    });
  }, [
    isFypModalShown,
    prefsReady,
    homepageOrder,
    personalRecommendations,
    doSetClientSetting_,
    doOpenModal_,
    doToast_,
  ]);
  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
  }, [language]);
  useEffect(() => {
    if (!languages.includes(language)) {
      fetchLanguage(language);

      if (document && document.documentElement && LANGUAGES[language] && LANGUAGES[language].length >= 3) {
        document.documentElement.dir = LANGUAGES[language][2];
      }
    } // eslint-disable-next-line react-hooks/exhaustive-deps
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
      analytics.event.emailVerified();
    }
  }, [previousHasVerifiedEmail, hasVerifiedEmail, signIn]);
  useEffect(() => {
    if (previousRewardApproved === false && isRewardApproved) {
      analytics.event.rewardEligible();
    }
  }, [previousRewardApproved, isRewardApproved]);
  // Load IMA3 SDK for aniview
  // useEffect(() => {
  //   if (!isAuthenticated && SHOW_ADS) {
  //     const script = document.createElement('script');
  //     script.src = imaLibraryPath;
  //     script.async = true;
  //     document.body.appendChild(script);
  //     return () => {
  //       document.body.removeChild(script);
  //     };
  //   }
  // }, []);
  // add OneTrust script
  useEffect(() => {
    // don't add script for embedded content
    function inIframe() {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    }

    if (inIframe()) return;
    const useProductionOneTrust = process.env.NODE_ENV === 'production' && window?.location?.hostname === 'odysee.com';
    const script = document.createElement('script');
    script.src = oneTrustScriptSrc;
    script.setAttribute('charset', 'UTF-8');

    if (useProductionOneTrust) {
      script.setAttribute('data-domain-script', '8a792d84-50a5-4b69-b080-6954ad4d4606');
    } else {
      script.setAttribute('data-domain-script', '8a792d84-50a5-4b69-b080-6954ad4d4606-test');
    }

    const secondScript = document.createElement('script');
    // OneTrust asks to add this
    secondScript.innerHTML = 'function OptanonWrapper() { window.gdprCallback() }';
    document.head.appendChild(script);
    document.head.appendChild(secondScript);
    return () => {
      try {
        document.head.removeChild(script);
        document.head.removeChild(secondScript);
      } catch (err) {
        // eslint-disable-next-line no-console
        // console.log(err); <-- disabling this ... it's clogging up Sentry logs.
      }
    }; // eslint-disable-next-line react-hooks/exhaustive-deps -- one time after locale is fetched
  }, [locale]);
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
      navigate(`/$/${PAGES.AUTH_WALLET_PASSWORD}?redirect=${pathname}`);
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncError, pathname, isAuthenticated, navigate]);
  useEffect(() => {
    if (prefsReady && isAuthenticated && (pathname === '/' || pathname === `/$/${PAGES.HELP}`) && announcement !== '') {
      doOpenAnnouncements_();
    }
  }, [announcement, isAuthenticated, pathname, prefsReady, doOpenAnnouncements_]);
  useEffect(() => {
    window.clearLastViewedAnnouncement = () => {
      console.log('Clearing history. Please wait ...'); // eslint-disable-line no-console

      doSetLastViewedAnnouncement_('clear');
    }; // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);
  // Keep this at the end to ensure initial setup effects are run first
  useEffect(() => {
    if (!hasSignedIn && hasVerifiedEmail) {
      signIn();
      setHasSignedIn(true);
    }
  }, [hasVerifiedEmail, signIn, hasSignedIn]);
  useDegradedPerformance(setLbryTvApiStatus, user, doSetAssignedLbrynetServer_);
  useEffect(() => {
    if (!syncIsLocked) {
      // When language is changed or translations are fetched, we render.
      setLangRenderKey(Date.now());
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- don't respond to syncIsLocked, but skip action when locked.
  }, [language, languages]);
  const appRef = React.useCallback((wrapperElement) => {
    if (wrapperElement) {
      ReactModal.setAppElement(wrapperElement);
    }
  }, []);

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

  if (connectionStatus.online && lbryTvApiStatus === STATUS_DOWN) {
    // TODO: Rename `SyncFatalError` since it has nothing to do with syncing.
    return (
      <React.Suspense fallback={null}>
        <SyncFatalError lbryTvApiStatus={lbryTvApiStatus} />
      </React.Suspense>
    );
  }

  return (
    <div className={MAIN_WRAPPER_CLASS} ref={appRef} key={langRenderKey}>
      {lbryTvApiStatus === STATUS_DOWN ? (
        <Yrbl
          className="main--empty"
          title={__('odysee.com is currently down')}
          subtitle={__('My wheel broke, but the good news is that someone from LBRY is working on it.')}
        />
      ) : (
        <AppContext.Provider
          value={{
            uri,
          }}
        >
          <Router uri={uri} />
          <Wander />
          <React.Suspense fallback={null}>
            <ModalRouter />
          </React.Suspense>
          <React.Suspense fallback={null}>{renderFiledrop && <FileDrop />}</React.Suspense>
          <React.Suspense fallback={null}>{!embedPath && <VideoRenderFloating />}</React.Suspense>
          <React.Suspense fallback={null}>
            {isEnhancedLayout && <Yrbl className="yrbl--enhanced" />}
            <YoutubeWelcome />
            {!shouldHideNag && <NagContinueFirstRun />}
            {fromLbrytvParam && !seenSunsestMessage && !shouldHideNag && (
              <NagSunset email={hasVerifiedEmail} onClose={() => setSeenSunsetMessage(true)} />
            )}
            {getStatusNag()}
            {useDebugLog && <DebugLog />}
          </React.Suspense>
        </AppContext.Provider>
      )}
    </div>
  );
}

export default App;
