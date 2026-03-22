import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import * as PAGES from 'constants/pages';
import * as SETTINGS from 'constants/settings';
import { PAGE_TITLE } from 'constants/pageTitles';
import { useIsSmallScreen, useIsMediumScreen, useIsLargeScreen } from 'effects/use-screensize';
import { lazyImport } from 'util/lazyImport';
import { LINKED_COMMENT_QUERY_PARAM } from 'constants/comment';
import { parseURI } from 'util/lbryURI';
import { SITE_TITLE } from 'config';
import LoadingBarOneOff from 'component/loadingBarOneOff';
import { GetLinksData } from 'util/buildHomepage';
import * as CS from 'constants/claim_search';
import { buildUnseenCountStr } from 'util/notifications';
import Spinner from 'component/spinner';
import HomePage from 'page/home';
import { getPathForPage, htmlDecode } from 'util/url';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectUserVerifiedEmail, selectUser } from 'redux/selectors/user';
import { selectHasNavigated, selectScrollStartingPosition } from 'redux/selectors/app';
import { selectClientSetting, selectHomepageData, selectWildWestDisabled } from 'redux/selectors/settings';
import { selectTitleForUri, selectChannelPermanentUriForUri, selectClaimUriForId } from 'redux/selectors/claims';
import { doSetHasNavigated, doSetActiveChannel } from 'redux/actions/app';
import { doUserSetReferrerForUri } from 'redux/actions/user';
import { selectHasUnclaimedRefereeReward } from 'redux/selectors/rewards';
import { selectUnseenNotificationCount } from 'redux/selectors/notifications';
const PLAYLIST_PATH = getPathForPage(PAGES.PLAYLIST);
const Code2257Page = lazyImport(
  () =>
    import(
      'web/page/code2257'
      /* webpackChunkName: "code2257" */
    )
);
const PrivacyPolicyPage = lazyImport(
  () =>
    import(
      'web/page/privacypolicy'
      /* webpackChunkName: "privacypolicy" */
    )
);
const TOSPage = lazyImport(
  () =>
    import(
      'web/page/tos'
      /* webpackChunkName: "tos" */
    )
);
const CareersPage = lazyImport(
  () =>
    import(
      'web/page/careers'
      /* webpackChunkName: "careers" */
    )
);
const CareersITProjectManagerPage = lazyImport(
  () =>
    import(
      'web/page/careers/itProjectManager'
      /* webpackChunkName: "itProjectManager" */
    )
);
const ContributePage = lazyImport(
  () =>
    import(
      'web/page/contribute'
      /* webpackChunkName: "contribute" */
    )
);
const SeniorBackendEngineerPage = lazyImport(
  () =>
    import(
      'web/page/careers/seniorBackendEngineer'
      /* webpackChunkName: "seniorBackendEngineer" */
    )
);
const SoftwareSecurityEngineerPage = lazyImport(
  () =>
    import(
      'web/page/careers/securityEngineer'
      /* webpackChunkName: "securityEngineer" */
    )
);
const SeniorAndroidDeveloperPage = lazyImport(
  () =>
    import(
      'web/page/careers/seniorAndroidDeveloper'
      /* webpackChunkName: "seniorAndroidDeveloper" */
    )
);
const SeniorIosDeveloperPage = lazyImport(
  () =>
    import(
      'web/page/careers/seniorIosDeveloper'
      /* webpackChunkName: "seniorIosDeveloper" */
    )
);
const IconsViewerPage = lazyImport(
  () =>
    import(
      'page/iconsViewer'
      /* webpackChunkName: "iconsViewer" */
    )
);
const FypPage = lazyImport(
  () =>
    import(
      'web/page/fyp'
      /* webpackChunkName: "fyp" */
    )
);
const YouTubeTOSPage = lazyImport(
  () =>
    import(
      'web/page/youtubetos'
      /* webpackChunkName: "youtubetos" */
    )
);
const SignInPage = lazyImport(
  () =>
    import(
      'page/signIn'
      /* webpackChunkName: "signIn" */
    )
);
const SignInWalletPasswordPage = lazyImport(
  () =>
    import(
      'page/signInWalletPassword'
      /* webpackChunkName: "signInWalletPassword" */
    )
);
const SignUpPage = lazyImport(
  () =>
    import(
      'page/signUp'
      /* webpackChunkName: "signUp" */
    )
);
const SignInVerifyPage = lazyImport(
  () =>
    import(
      'page/signInVerify'
      /* webpackChunkName: "signInVerify" */
    )
);
const ReceivePage = lazyImport(
  () =>
    import(
      'page/receive'
      /* webpackChunkName: "receive" */
    )
);
const SendPage = lazyImport(
  () =>
    import(
      'page/send'
      /* webpackChunkName: "send" */
    )
);
const SwapPage = lazyImport(
  () =>
    import(
      'page/swap'
      /* webpackChunkName: "swap" */
    )
);
const WalletPage = lazyImport(
  () =>
    import(
      'page/wallet'
      /* webpackChunkName: "wallet" */
    )
);
const NotificationsPage = lazyImport(
  () =>
    import(
      'page/notifications'
      /* webpackChunkName: "notifications" */
    )
);
const CollectionPage = lazyImport(
  () =>
    import(
      'page/collection'
      /* webpackChunkName: "collection" */
    )
);
const ChannelNew = lazyImport(
  () =>
    import(
      'page/channelNew'
      /* webpackChunkName: "channelNew" */
    )
);
const ChannelsFollowingDiscoverPage = lazyImport(
  () =>
    import(
      'page/channelsFollowingDiscover'
      /* webpackChunkName: "channelsFollowingDiscover" */
    )
);
const ChannelsFollowingPage = lazyImport(
  () =>
    import(
      'page/channelsFollowing'
      /* webpackChunkName: "channelsFollowing" */
    )
);
const ChannelsFollowingManage = lazyImport(
  () =>
    import(
      'page/channelsFollowingManage'
      /* webpackChunkName: "channelsFollowing" */
    )
);
const ChannelsPage = lazyImport(
  () =>
    import(
      'page/channels'
      /* webpackChunkName: "channels" */
    )
);
const CheckoutPage = lazyImport(
  () =>
    import(
      'page/checkoutPage'
      /* webpackChunkName: "checkoutPage" */
    )
);
const CreatorDashboard = lazyImport(
  () =>
    import(
      'page/creatorDashboard'
      /* webpackChunkName: "creatorDashboard" */
    )
);
const DiscoverPage = lazyImport(
  () =>
    import(
      'page/discover'
      /* webpackChunkName: "discover" */
    )
);
const EmbedWrapperPage = lazyImport(
  () =>
    import(
      'page/embedWrapper'
      /* webpackChunkName: "embedWrapper" */
    )
);
const PopoutChatPage = lazyImport(
  () =>
    import(
      'page/popoutChatWrapper'
      /* webpackChunkName: "popoutChat" */
    )
);
const FeaturedChannelsPage = lazyImport(
  () =>
    import(
      'page/featuredChannels'
      /* webpackChunkName: "featuredChannels" */
    )
);
const FileListPublished = lazyImport(
  () =>
    import(
      'page/fileListPublished'
      /* webpackChunkName: "fileListPublished" */
    )
);
const FourOhFourPage = lazyImport(
  () =>
    import(
      'page/fourOhFour'
      /* webpackChunkName: "fourOhFour" */
    )
);
const HelpPage = lazyImport(
  () =>
    import(
      'page/help'
      /* webpackChunkName: "help" */
    )
);
const HiddenContentPage = lazyImport(
  () =>
    import(
      'page/hiddenContent'
      /* webpackChunkName: "hiddenContent" */
    )
);
const InvitePage = lazyImport(
  () =>
    import(
      'page/invite'
      /* webpackChunkName: "invite" */
    )
);
const InvitedPage = lazyImport(
  () =>
    import(
      'page/invited'
      /* webpackChunkName: "invited" */
    )
);
const LibraryPage = lazyImport(
  () =>
    import(
      'page/library'
      /* webpackChunkName: "library" */
    )
);
const ListBlockedPage = lazyImport(
  () =>
    import(
      'page/listBlocked'
      /* webpackChunkName: "listBlocked" */
    )
);
const PlaylistsPage = lazyImport(
  () =>
    import(
      'page/playlists'
      /* webpackChunkName: "playlists" */
    )
);
const WatchHistoryPage = lazyImport(
  () =>
    import(
      'page/watchHistory'
      /* webpackChunkName: "history" */
    )
);
const LiveStreamSetupPage = lazyImport(
  () =>
    import(
      'page/livestreamSetup'
      /* webpackChunkName: "livestreamSetup" */
    )
);
const LivestreamCurrentPage = lazyImport(
  () =>
    import(
      'page/livestreamCurrent'
      /* webpackChunkName: "livestreamCurrent" */
    )
);
const LivestreamCreatePage = lazyImport(
  () =>
    import(
      'page/livestreamCreate'
      /* webpackChunkName: "livestreamCreate" */
    )
);
const OdyseeMembershipPage = lazyImport(
  () =>
    import(
      'page/odyseeMembership'
      /* webpackChunkName: "odyseeMembership" */
    )
);
const MembershipsLandingPage = lazyImport(
  () =>
    import(
      'page/creatorMemberships'
      /* webpackChunkName: "membershipsLanding" */
    )
);
const MembershipsCreatorAreaPage = lazyImport(
  () =>
    import(
      'page/creatorMemberships/creatorArea'
      /* webpackChunkName: "membershipsCreatorArea" */
    )
);
const MembershipsSupporterAreaPage = lazyImport(
  () =>
    import(
      'page/creatorMemberships/supporterArea'
      /* webpackChunkName: "membershipsSupporterArea" */
    )
);
const PortalPage = lazyImport(
  () =>
    import(
      'page/portal'
      /* webpackChunkName: "portal" */
    )
);
const OwnComments = lazyImport(
  () =>
    import(
      'page/ownComments'
      /* webpackChunkName: "ownComments" */
    )
);
const PasswordResetPage = lazyImport(
  () =>
    import(
      'page/passwordReset'
      /* webpackChunkName: "passwordReset" */
    )
);
const PasswordSetPage = lazyImport(
  () =>
    import(
      'page/passwordSet'
      /* webpackChunkName: "passwordSet" */
    )
);
const UploadPage = lazyImport(
  () =>
    import(
      'page/upload'
      /* webpackChunkName: "publish" */
    )
);
const PostPage = lazyImport(
  () =>
    import(
      'page/post'
      /* webpackChunkName: "post" */
    )
);
const ReportContentPage = lazyImport(
  () =>
    import(
      'page/reportContent'
      /* webpackChunkName: "reportContent" */
    )
);
const ReportPage = lazyImport(
  () =>
    import(
      'page/report'
      /* webpackChunkName: "report" */
    )
);
const RepostNew = lazyImport(
  () =>
    import(
      'page/repost'
      /* webpackChunkName: "repost" */
    )
);
const RewardsPage = lazyImport(
  () =>
    import(
      'page/rewards'
      /* webpackChunkName: "rewards" */
    )
);
const RewardsVerifyPage = lazyImport(
  () =>
    import(
      'page/rewardsVerify'
      /* webpackChunkName: "rewardsVerify" */
    )
);
const SearchPage = lazyImport(
  () =>
    import(
      'page/search'
      /* webpackChunkName: "search" */
    )
);
const SettingsStripeCard = lazyImport(
  () =>
    import(
      'page/settingsStripeCard'
      /* webpackChunkName: "settingsStripeCard" */
    )
);
const SettingsStripeAccount = lazyImport(
  () =>
    import(
      'page/settingsStripeAccount'
      /* webpackChunkName: "settingsStripeAccount" */
    )
);
// const SettingsCreatorPage = lazyImport(() => import('page/settingsCreator' /* webpackChunkName: "settingsCreator" */));
const SettingsNotificationsPage = lazyImport(
  () =>
    import(
      'page/settingsNotifications'
      /* webpackChunkName: "settingsNotifications" */
    )
);
const SettingsPage = lazyImport(
  () =>
    import(
      'page/settings'
      /* webpackChunkName: "settings" */
    )
);
const ClaimPage = lazyImport(
  () =>
    import(
      'page/claim'
      /* webpackChunkName: "claimPage" */
    )
);
const TagsFollowingManagePage = lazyImport(
  () =>
    import(
      'page/tagsFollowingManage'
      /* webpackChunkName: "tagsFollowingManage" */
    )
);
const TagsFollowingPage = lazyImport(
  () =>
    import(
      'page/tagsFollowing'
      /* webpackChunkName: "tagsFollowing" */
    )
);
const TopPage = lazyImport(
  () =>
    import(
      'page/top'
      /* webpackChunkName: "top" */
    )
);
const UpdatePasswordPage = lazyImport(
  () =>
    import(
      'page/passwordUpdate'
      /* webpackChunkName: "passwordUpdate" */
    )
);
const YoutubeSyncPage = lazyImport(
  () =>
    import(
      'page/youtubeSync'
      /* webpackChunkName: "youtubeSync" */
    )
);
const PaymentAccountPage = lazyImport(
  () =>
    import(
      'page/paymentAccount'
      /* webpackChunkName: "paymentAccountSync" */
    )
);
const ArAccountPage = lazyImport(
  () =>
    import(
      'page/arAccount'
      /* webpackChunkName: "arAccountPage" */
    )
);

// Tell the browser we are handling scroll restoration
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

type Props = {
  uri: string;
};
type PrivateRouteProps = {
  component: any;
  isAuthenticated: boolean;
  [key: string]: any;
};

function PrivateRoute(props: PrivateRouteProps) {
  const location = useLocation();
  const { component: Component, isAuthenticated, ...rest } = props;
  const urlSearchParams = new URLSearchParams(location.search);
  const redirectUrl = urlSearchParams.get('redirect');

  if (isAuthenticated || !IS_WEB) {
    return <Component {...rest} />;
  }

  return <Navigate replace to={`/$/${PAGES.AUTH}?redirect=${redirectUrl || location.pathname}`} />;
}

function AppRouter(props: Props) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const { uri: passedUri } = props;
  const dispatch = useAppDispatch();

  // Derive the effective URI (handle playlist pages)
  const { pathname: currentPathname } = location;
  const playlistCollectionId = currentPathname.startsWith(PLAYLIST_PATH)
    ? currentPathname.replace(PLAYLIST_PATH, '')
    : undefined;
  const playlistClaimUri = useAppSelector((state) =>
    playlistCollectionId ? selectClaimUriForId(state, playlistCollectionId) : undefined
  );
  const uri = passedUri;
  const effectiveUri = playlistClaimUri || passedUri;

  const currentScroll = useAppSelector(selectScrollStartingPosition);
  const isAuthenticated = useAppSelector(selectUserVerifiedEmail);
  const isGlobalMod = Boolean(useAppSelector(selectUser)?.global_mod);
  const hasNavigated = useAppSelector(selectHasNavigated);
  const hasUnclaimedRefereeReward = useAppSelector(selectHasUnclaimedRefereeReward);
  const homepageData = useAppSelector(selectHomepageData);
  const wildWestDisabled = useAppSelector(selectWildWestDisabled);
  const unseenCount = useAppSelector(selectUnseenNotificationCount);
  const hideTitleNotificationCount = useAppSelector((state) =>
    selectClientSetting(state, SETTINGS.HIDE_TITLE_NOTIFICATION_COUNT)
  );
  const hasDefaultChannel = Boolean(
    useAppSelector((state) => selectClientSetting(state, SETTINGS.ACTIVE_CHANNEL_CLAIM))
  );
  const channelClaimPermanentUri = useAppSelector((state) => selectChannelPermanentUriForUri(state, effectiveUri));
  const title = useAppSelector((state) => selectTitleForUri(state, effectiveUri));
  const setHasNavigated = () => dispatch(doSetHasNavigated());
  const { pathname, search, hash } = location;
  const defaultChannelRef = React.useRef(hasDefaultChannel);
  const urlParams = new URLSearchParams(search);
  const resetScroll = urlParams.get('reset_scroll');
  const hasLinkedCommentInUrl = urlParams.get(LINKED_COMMENT_QUERY_PARAM);
  const tagParams = urlParams.get(CS.TAGS_KEY);
  const isSmallScreen = useIsSmallScreen();
  const isMediumScreen = useIsMediumScreen();
  const isLargeScreen = useIsLargeScreen();
  const renderLegacyPage = React.useCallback((Component, routeProps = {}) => <Component {...routeProps} />, []);
  const categoryPages = React.useMemo(() => {
    if (!homepageData) return null;

    const dynamicRoutes = GetLinksData(homepageData, isSmallScreen, isMediumScreen, isLargeScreen).filter(
      (x: any) => x && x.route && (x.id !== 'WILD_WEST' || !wildWestDisabled)
    );

    return dynamicRoutes.map((dynamicRouteProps: RowDataItem) => (
      <Route
        key={dynamicRouteProps.route}
        path={dynamicRouteProps.route}
        element={renderLegacyPage(DiscoverPage, { dynamicRouteProps })}
      />
    ));
  }, [homepageData, isLargeScreen, isMediumScreen, isSmallScreen, renderLegacyPage, wildWestDisabled]);
  // For people arriving at settings page from deeplinks, know whether they can "go back"
  useEffect(() => {
    if (navigationType === 'PUSH' && !hasNavigated && setHasNavigated) {
      setHasNavigated();
    }
  }, [hasNavigated, navigationType, setHasNavigated]);
  useEffect(() => {
    if (channelClaimPermanentUri && !hasNavigated && hasUnclaimedRefereeReward && !isAuthenticated) {
      dispatch(doUserSetReferrerForUri(channelClaimPermanentUri));
    }
  }, [channelClaimPermanentUri, dispatch, hasNavigated, hasUnclaimedRefereeReward, isAuthenticated]);
  useEffect(() => {
    const getDefaultTitle = (pathname: string) => {
      let pageTitle = '';

      if (pathname.startsWith('/$/')) {
        const name = pathname.substring(3);

        if (pathname.startsWith(PLAYLIST_PATH)) {
          pageTitle = title;
        } else if (window.CATEGORY_PAGE_TITLE && window.CATEGORY_PAGE_TITLE[name]) {
          pageTitle = window.CATEGORY_PAGE_TITLE[name];
        } else {
          pageTitle = PAGE_TITLE[name];
        }
      }

      return __(pageTitle) || SITE_TITLE || 'Odysee';
    };

    if (uri) {
      const { channelName, streamName } = parseURI(uri);

      if (title) {
        document.title = title;
      } else if (streamName) {
        document.title = streamName;
      } else if (channelName) {
        document.title = channelName;
      } else {
        document.title = getDefaultTitle(pathname);
      }
    } else {
      document.title = getDefaultTitle(pathname);
    }

    if (unseenCount > 0 && !hideTitleNotificationCount) {
      document.title = `(${buildUnseenCountStr(unseenCount)}) ${document.title}`;
    }
  }, [pathname, title, uri, unseenCount, hideTitleNotificationCount]);
  useEffect(() => {
    if (!hasLinkedCommentInUrl) {
      if (hash && navigationType === 'PUSH') {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);

        if (element) {
          window.scrollTo(0, element.offsetTop);
        }
      } else {
        setTimeout(() => {
          window.scrollTo(0, currentScroll);
        }, 0);
      }
    }
  }, [currentScroll, pathname, search, hash, resetScroll, hasLinkedCommentInUrl, navigationType]);
  React.useEffect(() => {
    defaultChannelRef.current = hasDefaultChannel;
  }, [hasDefaultChannel]);
  React.useEffect(() => {
    if (window.pendingActiveChannel) {
      dispatch(doSetActiveChannel(window.pendingActiveChannel));
      delete window.pendingActiveChannel;
    } else if (
      defaultChannelRef.current &&
      pathname !== `/$/${PAGES.UPLOAD}` &&
      pathname !== `/$/${PAGES.POST}` &&
      !pathname.includes(`/$/${PAGES.LIST}/`) &&
      !pathname.includes(`/$/${PAGES.PLAYLIST}/`) &&
      pathname !== `/$/${PAGES.CREATOR_DASHBOARD}` &&
      pathname !== `/$/${PAGES.LIVESTREAM}`
    ) {
      // has a default channel selected, clear the current active channel
      dispatch(doSetActiveChannel(null, true));
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- Only on 'pathname' change
  }, [pathname]);
  // react-router doesn't decode pathanmes before doing the route matching check
  // We have to redirect here because if we redirect on the server, it might get encoded again
  // in the browser causing a redirect loop
  const decodedUrl = decodeURIComponent(pathname) + search;

  if (decodedUrl !== pathname + search) {
    return <Navigate replace to={decodedUrl} />;
  }

  // Try to support strange cases where url has html encoding
  const htmlDecodedUrl = htmlDecode(pathname + hash + search);

  if (htmlDecodedUrl !== pathname + hash + search) {
    return <Navigate replace to={htmlDecodedUrl} />;
  }

  return (
    <React.Suspense fallback={<LoadingBarOneOff />}>
      <Routes>
        <Route
          path={`/$/${PAGES.DEPRECATED__CHANNELS_FOLLOWING_MANAGE}`}
          element={<Navigate replace to={`/$/${PAGES.CHANNELS_FOLLOWING_DISCOVER}`} />}
        />
        <Route
          path={`/$/${PAGES.DEPRECATED__CHANNELS_FOLLOWING}`}
          element={<Navigate replace to={`/$/${PAGES.CHANNELS_FOLLOWING}`} />}
        />
        <Route
          path={`/$/${PAGES.DEPRECATED__TAGS_FOLLOWING}`}
          element={<Navigate replace to={`/$/${PAGES.TAGS_FOLLOWING}`} />}
        />
        <Route
          path={`/$/${PAGES.DEPRECATED__TAGS_FOLLOWING_MANAGE}`}
          element={<Navigate replace to={`/$/${PAGES.TAGS_FOLLOWING_MANAGE}`} />}
        />
        <Route path={`/$/${PAGES.DEPRECATED__PUBLISH}`} element={<Navigate replace to={`/$/${PAGES.UPLOAD}`} />} />
        <Route path={`/$/${PAGES.DEPRECATED__PUBLISHED}`} element={<Navigate replace to={`/$/${PAGES.UPLOADS}`} />} />

        <Route path="/" element={renderLegacyPage(HomePage)} />

        {(tagParams || isGlobalMod) && <Route path={`/$/${PAGES.DISCOVER}`} element={renderLegacyPage(DiscoverPage)} />}
        {categoryPages}

        <Route path={`/$/${PAGES.AUTH_SIGNIN}`} element={renderLegacyPage(SignInPage)} />
        <Route path={`/$/${PAGES.AUTH_PASSWORD_RESET}`} element={renderLegacyPage(PasswordResetPage)} />
        <Route path={`/$/${PAGES.AUTH_PASSWORD_SET}`} element={renderLegacyPage(PasswordSetPage)} />
        <Route path={`/$/${PAGES.AUTH}`} element={renderLegacyPage(SignUpPage)} />
        <Route path={`/$/${PAGES.AUTH}/*`} element={renderLegacyPage(SignUpPage)} />

        <Route path={`/$/${PAGES.HELP}`} element={renderLegacyPage(HelpPage)} />

        <Route path={`/$/${PAGES.FEATURED_CHANNELS}`} element={renderLegacyPage(FeaturedChannelsPage)} />
        <Route path={`/$/${PAGES.CODE_2257}`} element={renderLegacyPage(Code2257Page)} />
        <Route path={`/$/${PAGES.PRIVACY_POLICY}`} element={renderLegacyPage(PrivacyPolicyPage)} />
        <Route path={`/$/${PAGES.TOS}`} element={renderLegacyPage(TOSPage)} />
        <Route path={`/$/${PAGES.CAREERS}`} element={renderLegacyPage(CareersPage)} />
        <Route
          path={`/$/${PAGES.CAREERS_IT_PROJECT_MANAGER}`}
          element={renderLegacyPage(CareersITProjectManagerPage)}
        />
        <Route path={`/$/${PAGES.CONTRIBUTE}`} element={renderLegacyPage(ContributePage)} />
        <Route path={`/$/${PAGES.CONTRIBUTE}/:id`} element={renderLegacyPage(ContributePage)} />
        <Route
          path={`/$/${PAGES.CAREERS_SENIOR_BACKEND_ENGINEER}`}
          element={renderLegacyPage(SeniorBackendEngineerPage)}
        />
        <Route
          path={`/$/${PAGES.CAREERS_SOFTWARE_SECURITY_ENGINEER}`}
          element={renderLegacyPage(SoftwareSecurityEngineerPage)}
        />
        <Route
          path={`/$/${PAGES.CAREERS_SENIOR_ANDROID_DEVELOPER}`}
          element={renderLegacyPage(SeniorAndroidDeveloperPage)}
        />
        <Route path={`/$/${PAGES.CAREERS_SENIOR_IOS_DEVELOPER}`} element={renderLegacyPage(SeniorIosDeveloperPage)} />
        <Route path={`/$/${PAGES.FYP}`} element={renderLegacyPage(FypPage)} />
        <Route path={`/$/${PAGES.YOUTUBE_TOS}`} element={renderLegacyPage(YouTubeTOSPage)} />
        <Route path={`/$/${PAGES.ICONS_VIEWER}`} element={renderLegacyPage(IconsViewerPage)} />

        <Route path={`/$/${PAGES.AUTH_VERIFY}`} element={renderLegacyPage(SignInVerifyPage)} />
        <Route path={`/$/${PAGES.SEARCH}`} element={renderLegacyPage(SearchPage)} />
        <Route path={`/$/${PAGES.TOP}`} element={renderLegacyPage(TopPage)} />
        <Route path={`/$/${PAGES.SETTINGS}`} element={renderLegacyPage(SettingsPage)} />
        <Route path={`/$/${PAGES.INVITE}/:referrer`} element={renderLegacyPage(InvitedPage)} />
        <Route path={`/$/${PAGES.CHECKOUT}`} element={renderLegacyPage(CheckoutPage)} />
        <Route path={`/$/${PAGES.REPORT_CONTENT}`} element={renderLegacyPage(ReportContentPage)} />
        <Route path={`/$/${PAGES.LIST}/:collectionId`} element={renderLegacyPage(CollectionPage)} />
        <Route path={`/$/${PAGES.PLAYLIST}/:collectionId`} element={renderLegacyPage(CollectionPage)} />
        <Route
          path={`/$/${PAGES.CHANNELS_FOLLOWING_DISCOVER}`}
          element={renderLegacyPage(ChannelsFollowingDiscoverPage)}
        />
        <Route
          path={`/$/${PAGES.YOUTUBE_SYNC}`}
          element={<PrivateRoute component={YoutubeSyncPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.TAGS_FOLLOWING}`}
          element={<PrivateRoute component={TagsFollowingPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.CHANNELS_FOLLOWING}`}
          element={
            <PrivateRoute
              component={isAuthenticated || !IS_WEB ? ChannelsFollowingPage : DiscoverPage}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route path={`/$/${PAGES.SETTINGS_NOTIFICATIONS}`} element={renderLegacyPage(SettingsNotificationsPage)} />
        <Route
          path={`/$/${PAGES.SETTINGS_STRIPE_CARD}`}
          element={<PrivateRoute component={SettingsStripeCard} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.SETTINGS_STRIPE_ACCOUNT}`}
          element={<PrivateRoute component={SettingsStripeAccount} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.SETTINGS_UPDATE_PWD}`}
          element={<PrivateRoute component={UpdatePasswordPage} isAuthenticated={isAuthenticated} />}
        />

        <Route
          path={`/$/${PAGES.CHANNELS_FOLLOWING_MANAGE}`}
          element={<PrivateRoute component={ChannelsFollowingManage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.INVITE}`}
          element={<PrivateRoute component={InvitePage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.CHANNEL_NEW}`}
          element={<PrivateRoute component={ChannelNew} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.REPOST_NEW}`}
          element={<PrivateRoute component={RepostNew} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.UPLOADS}`}
          element={<PrivateRoute component={FileListPublished} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.CREATOR_DASHBOARD}`}
          element={<PrivateRoute component={CreatorDashboard} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.UPLOAD}`}
          element={<PrivateRoute component={UploadPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.POST}`}
          element={<PrivateRoute component={PostPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.REPORT}`}
          element={<PrivateRoute component={ReportPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.REWARDS}`}
          element={<PrivateRoute component={RewardsPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.REWARDS_VERIFY}`}
          element={<PrivateRoute component={RewardsVerifyPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.LIBRARY}`}
          element={<PrivateRoute component={LibraryPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.LISTS}`}
          element={<PrivateRoute component={PlaylistsPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.PLAYLISTS}`}
          element={<PrivateRoute component={PlaylistsPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.WATCH_HISTORY}`}
          element={<PrivateRoute component={WatchHistoryPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.TAGS_FOLLOWING_MANAGE}`}
          element={<PrivateRoute component={TagsFollowingManagePage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.SETTINGS_BLOCKED_MUTED}`}
          element={<PrivateRoute component={ListBlockedPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.WALLET}`}
          element={<PrivateRoute component={WalletPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.CHANNELS}`}
          element={<PrivateRoute component={ChannelsPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.LIVESTREAM_CREATE}`}
          element={<PrivateRoute component={LivestreamCreatePage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.LIVESTREAM}`}
          element={<PrivateRoute component={LiveStreamSetupPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.LIVESTREAM_CURRENT}`}
          element={<PrivateRoute component={LivestreamCurrentPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.HIDDEN_CONTENT}`}
          element={<PrivateRoute component={HiddenContentPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.RECEIVE}`}
          element={<PrivateRoute component={ReceivePage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.SEND}`}
          element={<PrivateRoute component={SendPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.SWAP}`}
          element={<PrivateRoute component={SwapPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.NOTIFICATIONS}`}
          element={<PrivateRoute component={NotificationsPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.AUTH_WALLET_PASSWORD}`}
          element={<PrivateRoute component={SignInWalletPasswordPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.SETTINGS_OWN_COMMENTS}`}
          element={<PrivateRoute component={OwnComments} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.ODYSEE_MEMBERSHIP}`}
          element={<PrivateRoute component={OdyseeMembershipPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.CREATOR_MEMBERSHIPS}`}
          element={<PrivateRoute component={MembershipsCreatorAreaPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.MEMBERSHIPS_SUPPORTER}`}
          element={<PrivateRoute component={MembershipsSupporterAreaPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.MEMBERSHIPS_LANDING}`}
          element={<PrivateRoute component={MembershipsLandingPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.PAYMENTACCOUNT}`}
          element={<PrivateRoute component={PaymentAccountPage} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path={`/$/${PAGES.ARACCOUNT}`}
          element={<PrivateRoute component={ArAccountPage} isAuthenticated={isAuthenticated} />}
        />
        <Route path={`/$/${PAGES.PORTAL}/:portalName`} element={renderLegacyPage(PortalPage)} />

        <Route path={`/$/${PAGES.POPOUT}/:channelName/:streamName`} element={renderLegacyPage(PopoutChatPage)} />

        <Route path={`/$/${PAGES.EMBED}/home`} element={renderLegacyPage(HomePage)} />
        <Route path={`/$/${PAGES.EMBED}/:claimName`} element={renderLegacyPage(EmbedWrapperPage)} />
        <Route path={`/$/${PAGES.EMBED}/:claimName/:claimId`} element={renderLegacyPage(EmbedWrapperPage)} />

        <Route
          path={`/$/${PAGES.LATEST}/:channelName`}
          element={renderLegacyPage(ClaimPage, { uri, latestContentPath: true })}
        />
        <Route
          path={`/$/${PAGES.LIVE_NOW}/:channelName`}
          element={renderLegacyPage(ClaimPage, { uri, liveContentPath: true })}
        />

        {homepageData === undefined ? (
          <Route
            path={`/$/:maybeCategoryPage`}
            element={
              <div className="main--empty">
                <Spinner text={__('Loading category...')} />
              </div>
            }
          />
        ) : (
          <Route path="/$/:nonExistingPage" element={renderLegacyPage(FourOhFourPage)} />
        )}

        <Route path="/:claimName" element={renderLegacyPage(ClaimPage, { uri })} />
        <Route path="/:claimName/:streamName" element={renderLegacyPage(ClaimPage, { uri })} />
        <Route path="*" element={renderLegacyPage(FourOhFourPage)} />
      </Routes>
    </React.Suspense>
  );
}

export default AppRouter;
