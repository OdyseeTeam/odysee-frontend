// @flow
import React, { useEffect } from 'react';
import { Route, Redirect, Switch, withRouter } from 'react-router-dom';

import * as PAGES from 'constants/pages';
import { PAGE_TITLE } from 'constants/pageTitles';
import { useIsLargeScreen } from 'effects/use-screensize';
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

import { getPathForPage } from 'util/url';

const PLAYLIST_PATH = getPathForPage(PAGES.PLAYLIST);

const Code2257Page = lazyImport(() => import('web/page/code2257' /* webpackChunkName: "code2257" */));
const PrivacyPolicyPage = lazyImport(() => import('web/page/privacypolicy' /* webpackChunkName: "privacypolicy" */));
const TOSPage = lazyImport(() => import('web/page/tos' /* webpackChunkName: "tos" */));
const CareersPage = lazyImport(() => import('web/page/careers' /* webpackChunkName: "careers" */));
const CareersITProjectManagerPage = lazyImport(() =>
  import('web/page/careers/itProjectManager' /* webpackChunkName: "itProjectManager" */)
);
const SeniorBackendEngineerPage = lazyImport(() =>
  import('web/page/careers/seniorBackendEngineer' /* webpackChunkName: "seniorBackendEngineer" */)
);

const SoftwareSecurityEngineerPage = lazyImport(() =>
  import('web/page/careers/securityEngineer' /* webpackChunkName: "securityEngineer" */)
);
const SeniorAndroidDeveloperPage = lazyImport(() =>
  import('web/page/careers/seniorAndroidDeveloper' /* webpackChunkName: "seniorAndroidDeveloper" */)
);
const SeniorIosDeveloperPage = lazyImport(() =>
  import('web/page/careers/seniorIosDeveloper' /* webpackChunkName: "seniorIosDeveloper" */)
);
const IconsViewerPage = lazyImport(() => import('page/iconsViewer' /* webpackChunkName: "iconsViewer" */));

const FypPage = lazyImport(() => import('web/page/fyp' /* webpackChunkName: "fyp" */));
const YouTubeTOSPage = lazyImport(() => import('web/page/youtubetos' /* webpackChunkName: "youtubetos" */));

const SignInPage = lazyImport(() => import('page/signIn' /* webpackChunkName: "signIn" */));
const SignInWalletPasswordPage = lazyImport(() =>
  import('page/signInWalletPassword' /* webpackChunkName: "signInWalletPassword" */)
);
const SignUpPage = lazyImport(() => import('page/signUp' /* webpackChunkName: "signUp" */));
const SignInVerifyPage = lazyImport(() => import('page/signInVerify' /* webpackChunkName: "signInVerify" */));

const ReceivePage = lazyImport(() => import('page/receive' /* webpackChunkName: "receive" */));
const SendPage = lazyImport(() => import('page/send' /* webpackChunkName: "send" */));
const SwapPage = lazyImport(() => import('page/swap' /* webpackChunkName: "swap" */));
const WalletPage = lazyImport(() => import('page/wallet' /* webpackChunkName: "wallet" */));

const NotificationsPage = lazyImport(() => import('page/notifications' /* webpackChunkName: "notifications" */));
const CollectionPage = lazyImport(() => import('page/collection' /* webpackChunkName: "collection" */));
const ChannelNew = lazyImport(() => import('page/channelNew' /* webpackChunkName: "channelNew" */));
const ChannelsFollowingDiscoverPage = lazyImport(() =>
  import('page/channelsFollowingDiscover' /* webpackChunkName: "channelsFollowingDiscover" */)
);
const ChannelsFollowingPage = lazyImport(() =>
  import('page/channelsFollowing' /* webpackChunkName: "channelsFollowing" */)
);
const ChannelsFollowingManage = lazyImport(() =>
  import('page/channelsFollowingManage' /* webpackChunkName: "channelsFollowing" */)
);
const ChannelsPage = lazyImport(() => import('page/channels' /* webpackChunkName: "channels" */));
const CheckoutPage = lazyImport(() => import('page/checkoutPage' /* webpackChunkName: "checkoutPage" */));
const CreatorDashboard = lazyImport(() => import('page/creatorDashboard' /* webpackChunkName: "creatorDashboard" */));
const DiscoverPage = lazyImport(() => import('page/discover' /* webpackChunkName: "discover" */));
const EmbedWrapperPage = lazyImport(() => import('page/embedWrapper' /* webpackChunkName: "embedWrapper" */));
const PopoutChatPage = lazyImport(() => import('page/popoutChatWrapper' /* webpackChunkName: "popoutChat" */));
const FeaturedChannelsPage = lazyImport(() =>
  import('page/featuredChannels' /* webpackChunkName: "featuredChannels" */)
);
const FileListPublished = lazyImport(() =>
  import('page/fileListPublished' /* webpackChunkName: "fileListPublished" */)
);
const FourOhFourPage = lazyImport(() => import('page/fourOhFour' /* webpackChunkName: "fourOhFour" */));
const HelpPage = lazyImport(() => import('page/help' /* webpackChunkName: "help" */));
const HiddenContentPage = lazyImport(() => import('page/hiddenContent' /* webpackChunkName: "hiddenContent" */));
const InvitePage = lazyImport(() => import('page/invite' /* webpackChunkName: "invite" */));
const InvitedPage = lazyImport(() => import('page/invited' /* webpackChunkName: "invited" */));
const LibraryPage = lazyImport(() => import('page/library' /* webpackChunkName: "library" */));
const ListBlockedPage = lazyImport(() => import('page/listBlocked' /* webpackChunkName: "listBlocked" */));
const PlaylistsPage = lazyImport(() => import('page/playlists' /* webpackChunkName: "playlists" */));
const WatchHistoryPage = lazyImport(() => import('page/watchHistory' /* webpackChunkName: "history" */));
const LiveStreamSetupPage = lazyImport(() => import('page/livestreamSetup' /* webpackChunkName: "livestreamSetup" */));
const LivestreamCurrentPage = lazyImport(() =>
  import('page/livestreamCurrent' /* webpackChunkName: "livestreamCurrent" */)
);
const LivestreamCreatePage = lazyImport(() =>
  import('page/livestreamCreate' /* webpackChunkName: "livestreamCreate" */)
);
const OdyseeMembershipPage = lazyImport(() =>
  import('page/odyseeMembership' /* webpackChunkName: "odyseeMembership" */)
);
const MembershipsLandingPage = lazyImport(() =>
  import('page/creatorMemberships' /* webpackChunkName: "membershipsLanding" */)
);
const MembershipsCreatorAreaPage = lazyImport(() =>
  import('page/creatorMemberships/creatorArea' /* webpackChunkName: "membershipsCreatorArea" */)
);
const MembershipsSupporterAreaPage = lazyImport(() =>
  import('page/creatorMemberships/supporterArea' /* webpackChunkName: "membershipsSupporterArea" */)
);
const PortalPage = lazyImport(() => import('page/portal' /* webpackChunkName: "portal" */));
const OwnComments = lazyImport(() => import('page/ownComments' /* webpackChunkName: "ownComments" */));
const PasswordResetPage = lazyImport(() => import('page/passwordReset' /* webpackChunkName: "passwordReset" */));
const PasswordSetPage = lazyImport(() => import('page/passwordSet' /* webpackChunkName: "passwordSet" */));
const UploadPage = lazyImport(() => import('page/upload' /* webpackChunkName: "publish" */));
const PostPage = lazyImport(() => import('page/post' /* webpackChunkName: "post" */));
const ReportContentPage = lazyImport(() => import('page/reportContent' /* webpackChunkName: "reportContent" */));
const ReportPage = lazyImport(() => import('page/report' /* webpackChunkName: "report" */));
const RepostNew = lazyImport(() => import('page/repost' /* webpackChunkName: "repost" */));
const RewardsPage = lazyImport(() => import('page/rewards' /* webpackChunkName: "rewards" */));
const RewardsVerifyPage = lazyImport(() => import('page/rewardsVerify' /* webpackChunkName: "rewardsVerify" */));
const SearchPage = lazyImport(() => import('page/search' /* webpackChunkName: "search" */));
const SettingsStripeCard = lazyImport(() =>
  import('page/settingsStripeCard' /* webpackChunkName: "settingsStripeCard" */)
);
const SettingsStripeAccount = lazyImport(() =>
  import('page/settingsStripeAccount' /* webpackChunkName: "settingsStripeAccount" */)
);
// const SettingsCreatorPage = lazyImport(() => import('page/settingsCreator' /* webpackChunkName: "settingsCreator" */));
const SettingsNotificationsPage = lazyImport(() =>
  import('page/settingsNotifications' /* webpackChunkName: "settingsNotifications" */)
);
const SettingsPage = lazyImport(() => import('page/settings' /* webpackChunkName: "settings" */));
const ClaimPage = lazyImport(() => import('page/claim' /* webpackChunkName: "claimPage" */));
const TagsFollowingManagePage = lazyImport(() =>
  import('page/tagsFollowingManage' /* webpackChunkName: "tagsFollowingManage" */)
);
const TagsFollowingPage = lazyImport(() => import('page/tagsFollowing' /* webpackChunkName: "tagsFollowing" */));
const TopPage = lazyImport(() => import('page/top' /* webpackChunkName: "top" */));
const UpdatePasswordPage = lazyImport(() => import('page/passwordUpdate' /* webpackChunkName: "passwordUpdate" */));
const YoutubeSyncPage = lazyImport(() => import('page/youtubeSync' /* webpackChunkName: "youtubeSync" */));
const PaymentAccountPage = lazyImport(() => import('page/paymentAccount' /* webpackChunkName: "paymentAccountSync" */));
const ArAccountPage = lazyImport(() => import('page/arAccount' /* webpackChunkName: "arAccountPage" */));

// Tell the browser we are handling scroll restoration
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

type Props = {
  currentScroll: number,
  isAuthenticated: boolean,
  location: { pathname: string, search: string, hash: string },
  history: {
    action: string,
    entries: { title: string }[],
    goBack: () => void,
    goForward: () => void,
    index: number,
    length: number,
    location: { pathname: string },
    push: (string) => void,
    state: {},
    replaceState: ({}, string, string) => void,
    listen: (any) => () => void,
  },
  uri: string,
  channelClaimPermanentUri: ?string,
  title: string,
  hasNavigated: boolean,
  setHasNavigated: () => void,
  doUserSetReferrerForUri: (referrerPermanentUri: string) => void,
  hasUnclaimedRefereeReward: boolean,
  homepageData: any,
  wildWestDisabled: boolean,
  unseenCount: number,
  hideTitleNotificationCount: boolean,
  hasDefaultChannel: boolean,
  doSetActiveChannel: (claimId: ?string, override?: boolean) => void,
  isGlobalMod: boolean,
};

type PrivateRouteProps = Props & {
  component: any,
  isAuthenticated: boolean,
};

function PrivateRoute(props: PrivateRouteProps) {
  const { component: Component, isAuthenticated, ...rest } = props;
  const urlSearchParams = new URLSearchParams(props.location.search);
  const redirectUrl = urlSearchParams.get('redirect');
  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated || !IS_WEB ? (
          <Component {...props} />
        ) : (
          <Redirect to={`/$/${PAGES.AUTH}?redirect=${redirectUrl || props.location.pathname}`} />
        )
      }
    />
  );
}

function AppRouter(props: Props) {
  const {
    currentScroll,
    location: { pathname, search, hash },
    isAuthenticated,
    history,
    uri,
    channelClaimPermanentUri,
    title,
    hasNavigated,
    setHasNavigated,
    hasUnclaimedRefereeReward,
    doUserSetReferrerForUri,
    homepageData,
    wildWestDisabled,
    unseenCount,
    hideTitleNotificationCount,
    hasDefaultChannel,
    doSetActiveChannel,
    isGlobalMod,
  } = props;

  const defaultChannelRef = React.useRef(hasDefaultChannel);

  const { entries, listen, action: historyAction } = history;
  const entryIndex = history.index;
  const urlParams = new URLSearchParams(search);
  const resetScroll = urlParams.get('reset_scroll');
  const hasLinkedCommentInUrl = urlParams.get(LINKED_COMMENT_QUERY_PARAM);
  const tagParams = urlParams.get(CS.TAGS_KEY);
  const isLargeScreen = useIsLargeScreen();

  const ClaimPageRender = React.useMemo(() => () => <ClaimPage uri={uri} />, [uri]);
  const ClaimPageLatest = React.useMemo(() => () => <ClaimPage uri={uri} latestContentPath />, [uri]);
  const ClaimPageLivenow = React.useMemo(() => () => <ClaimPage uri={uri} liveContentPath />, [uri]);

  const categoryPages = React.useMemo(() => {
    if (!homepageData) return null;

    const dynamicRoutes = GetLinksData(homepageData, isLargeScreen).filter(
      (x: any) => x && x.route && (x.id !== 'WILD_WEST' || !wildWestDisabled)
    );

    return dynamicRoutes.map((dynamicRouteProps: RowDataItem) => (
      <Route
        key={dynamicRouteProps.route}
        path={dynamicRouteProps.route}
        component={(routerProps) => <DiscoverPage {...routerProps} dynamicRouteProps={dynamicRouteProps} />}
      />
    ));
  }, [homepageData, isLargeScreen, wildWestDisabled]);

  // For people arriving at settings page from deeplinks, know whether they can "go back"
  useEffect(() => {
    const unlisten = listen((location, action) => {
      if (action === 'PUSH') {
        if (!hasNavigated && setHasNavigated) setHasNavigated();
      }
    });
    return unlisten;
  }, [listen, hasNavigated, setHasNavigated]);

  useEffect(() => {
    if (channelClaimPermanentUri && !hasNavigated && hasUnclaimedRefereeReward && !isAuthenticated) {
      doUserSetReferrerForUri(channelClaimPermanentUri);
    }
  }, [channelClaimPermanentUri, doUserSetReferrerForUri, hasNavigated, hasUnclaimedRefereeReward, isAuthenticated]);

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
  }, [pathname, entries, entryIndex, title, uri, unseenCount, hideTitleNotificationCount]);

  useEffect(() => {
    if (!hasLinkedCommentInUrl) {
      if (hash && historyAction === 'PUSH') {
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
  }, [currentScroll, pathname, search, hash, resetScroll, hasLinkedCommentInUrl, historyAction]);

  React.useEffect(() => {
    defaultChannelRef.current = hasDefaultChannel;
  }, [hasDefaultChannel]);

  React.useEffect(() => {
    if (window.pendingActiveChannel) {
      doSetActiveChannel(window.pendingActiveChannel);
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
      doSetActiveChannel(null, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only on 'pathname' change
  }, [pathname]);

  // react-router doesn't decode pathanmes before doing the route matching check
  // We have to redirect here because if we redirect on the server, it might get encoded again
  // in the browser causing a redirect loop
  const decodedUrl = decodeURIComponent(pathname) + search;
  if (decodedUrl !== pathname + search) {
    return <Redirect to={decodedUrl} />;
  }

  return (
    <React.Suspense fallback={<LoadingBarOneOff />}>
      <Switch>
        <Redirect
          from={`/$/${PAGES.DEPRECATED__CHANNELS_FOLLOWING_MANAGE}`}
          to={`/$/${PAGES.CHANNELS_FOLLOWING_DISCOVER}`}
        />
        <Redirect from={`/$/${PAGES.DEPRECATED__CHANNELS_FOLLOWING}`} to={`/$/${PAGES.CHANNELS_FOLLOWING}`} />
        <Redirect from={`/$/${PAGES.DEPRECATED__TAGS_FOLLOWING}`} to={`/$/${PAGES.TAGS_FOLLOWING}`} />
        <Redirect from={`/$/${PAGES.DEPRECATED__TAGS_FOLLOWING_MANAGE}`} to={`/$/${PAGES.TAGS_FOLLOWING_MANAGE}`} />
        <Redirect from={`/$/${PAGES.DEPRECATED__PUBLISH}`} to={`/$/${PAGES.UPLOAD}`} />
        <Redirect from={`/$/${PAGES.DEPRECATED__PUBLISHED}`} to={`/$/${PAGES.UPLOADS}`} />

        <Route path={`/`} exact component={HomePage} />

        {(tagParams || isGlobalMod) && <Route path={`/$/${PAGES.DISCOVER}`} exact component={DiscoverPage} />}
        {categoryPages}

        <Route path={`/$/${PAGES.AUTH_SIGNIN}`} exact component={SignInPage} />
        <Route path={`/$/${PAGES.AUTH_PASSWORD_RESET}`} exact component={PasswordResetPage} />
        <Route path={`/$/${PAGES.AUTH_PASSWORD_SET}`} exact component={PasswordSetPage} />
        <Route path={`/$/${PAGES.AUTH}`} exact component={SignUpPage} />
        <Route path={`/$/${PAGES.AUTH}/*`} exact component={SignUpPage} />

        <Route path={`/$/${PAGES.HELP}`} exact component={HelpPage} />

        <Route path={`/$/${PAGES.FEATURED_CHANNELS}`} exact component={FeaturedChannelsPage} />
        <Route path={`/$/${PAGES.CODE_2257}`} exact component={Code2257Page} />
        <Route path={`/$/${PAGES.PRIVACY_POLICY}`} exact component={PrivacyPolicyPage} />
        <Route path={`/$/${PAGES.TOS}`} exact component={TOSPage} />
        <Route path={`/$/${PAGES.CAREERS}`} exact component={CareersPage} />
        <Route path={`/$/${PAGES.CAREERS_IT_PROJECT_MANAGER}`} exact component={CareersITProjectManagerPage} />
        <Route path={`/$/${PAGES.CAREERS_SENIOR_BACKEND_ENGINEER}`} exact component={SeniorBackendEngineerPage} />
        <Route path={`/$/${PAGES.CAREERS_SOFTWARE_SECURITY_ENGINEER}`} exact component={SoftwareSecurityEngineerPage} />
        <Route path={`/$/${PAGES.CAREERS_SENIOR_ANDROID_DEVELOPER}`} exact component={SeniorAndroidDeveloperPage} />
        <Route path={`/$/${PAGES.CAREERS_SENIOR_IOS_DEVELOPER}`} exact component={SeniorIosDeveloperPage} />
        <Route path={`/$/${PAGES.FYP}`} exact component={FypPage} />
        <Route path={`/$/${PAGES.YOUTUBE_TOS}`} exact component={YouTubeTOSPage} />
        <Route path={`/$/${PAGES.ICONS_VIEWER}`} exact component={IconsViewerPage} />

        <Route path={`/$/${PAGES.AUTH_VERIFY}`} exact component={SignInVerifyPage} />
        <Route path={`/$/${PAGES.SEARCH}`} exact component={SearchPage} />
        <Route path={`/$/${PAGES.TOP}`} exact component={TopPage} />
        <Route path={`/$/${PAGES.SETTINGS}`} exact component={SettingsPage} />
        <Route path={`/$/${PAGES.INVITE}/:referrer`} exact component={InvitedPage} />
        <Route path={`/$/${PAGES.CHECKOUT}`} exact component={CheckoutPage} />
        <Route path={`/$/${PAGES.REPORT_CONTENT}`} exact component={ReportContentPage} />
        <Route {...props} path={`/$/${PAGES.LIST}/:collectionId`} component={CollectionPage} />
        <Route {...props} path={`/$/${PAGES.PLAYLIST}/:collectionId`} component={CollectionPage} />
        <Route
          {...props}
          exact
          path={`/$/${PAGES.CHANNELS_FOLLOWING_DISCOVER}`}
          component={ChannelsFollowingDiscoverPage}
        />
        <PrivateRoute {...props} exact path={`/$/${PAGES.YOUTUBE_SYNC}`} component={YoutubeSyncPage} />
        <PrivateRoute {...props} exact path={`/$/${PAGES.TAGS_FOLLOWING}`} component={TagsFollowingPage} />
        <PrivateRoute
          {...props}
          exact
          path={`/$/${PAGES.CHANNELS_FOLLOWING}`}
          component={isAuthenticated || !IS_WEB ? ChannelsFollowingPage : DiscoverPage}
        />
        <Route {...props} path={`/$/${PAGES.SETTINGS_NOTIFICATIONS}`} component={SettingsNotificationsPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.SETTINGS_STRIPE_CARD}`} component={SettingsStripeCard} />
        <PrivateRoute {...props} path={`/$/${PAGES.SETTINGS_STRIPE_ACCOUNT}`} component={SettingsStripeAccount} />
        <PrivateRoute {...props} path={`/$/${PAGES.SETTINGS_UPDATE_PWD}`} component={UpdatePasswordPage} />

        <PrivateRoute
          {...props}
          exact
          path={`/$/${PAGES.CHANNELS_FOLLOWING_MANAGE}`}
          component={ChannelsFollowingManage}
        />
        <PrivateRoute {...props} path={`/$/${PAGES.INVITE}`} component={InvitePage} />
        <PrivateRoute {...props} path={`/$/${PAGES.CHANNEL_NEW}`} component={ChannelNew} />
        <PrivateRoute {...props} path={`/$/${PAGES.REPOST_NEW}`} component={RepostNew} />
        <PrivateRoute {...props} path={`/$/${PAGES.UPLOADS}`} component={FileListPublished} />
        <PrivateRoute {...props} path={`/$/${PAGES.CREATOR_DASHBOARD}`} component={CreatorDashboard} />
        <PrivateRoute {...props} path={`/$/${PAGES.UPLOAD}`} component={UploadPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.POST}`} component={PostPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.REPORT}`} component={ReportPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.REWARDS}`} exact component={RewardsPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.REWARDS_VERIFY}`} component={RewardsVerifyPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.LIBRARY}`} component={LibraryPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.LISTS}`} component={PlaylistsPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.PLAYLISTS}`} component={PlaylistsPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.WATCH_HISTORY}`} component={WatchHistoryPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.TAGS_FOLLOWING_MANAGE}`} component={TagsFollowingManagePage} />
        <PrivateRoute {...props} path={`/$/${PAGES.SETTINGS_BLOCKED_MUTED}`} component={ListBlockedPage} />
        {/* <PrivateRoute {...props} path={`/$/${PAGES.SETTINGS_CREATOR}`} component={SettingsCreatorPage} /> */}
        <PrivateRoute {...props} path={`/$/${PAGES.WALLET}`} exact component={WalletPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.CHANNELS}`} component={ChannelsPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.LIVESTREAM_CREATE}`} component={LivestreamCreatePage} />
        <PrivateRoute {...props} path={`/$/${PAGES.LIVESTREAM}`} component={LiveStreamSetupPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.LIVESTREAM_CURRENT}`} component={LivestreamCurrentPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.HIDDEN_CONTENT}`} component={HiddenContentPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.RECEIVE}`} component={ReceivePage} />
        <PrivateRoute {...props} path={`/$/${PAGES.SEND}`} component={SendPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.SWAP}`} component={SwapPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.NOTIFICATIONS}`} component={NotificationsPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.AUTH_WALLET_PASSWORD}`} component={SignInWalletPasswordPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.SETTINGS_OWN_COMMENTS}`} component={OwnComments} />
        <PrivateRoute {...props} path={`/$/${PAGES.ODYSEE_MEMBERSHIP}`} component={OdyseeMembershipPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.CREATOR_MEMBERSHIPS}`} component={MembershipsCreatorAreaPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.MEMBERSHIPS_SUPPORTER}`} component={MembershipsSupporterAreaPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.MEMBERSHIPS_LANDING}`} component={MembershipsLandingPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.PAYMENTACCOUNT}`} component={PaymentAccountPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.ARACCOUNT}`} component={ArAccountPage} />
        <Route path={`/$/${PAGES.PORTAL}/:portalName`} exact component={PortalPage} />

        <Route path={`/$/${PAGES.POPOUT}/:channelName/:streamName`} component={PopoutChatPage} />

        <Route path={`/$/${PAGES.EMBED}/:claimName`} exact component={EmbedWrapperPage} />
        <Route path={`/$/${PAGES.EMBED}/:claimName/:claimId`} exact component={EmbedWrapperPage} />

        {/* Below need to go at the end to make sure we don't match any of our pages first */}
        <Route path={`/$/${PAGES.LATEST}/:channelName`} exact component={ClaimPageLatest} />
        <Route path={`/$/${PAGES.LIVE_NOW}/:channelName`} exact component={ClaimPageLivenow} />

        {/* When fetching homepage data, display a loading state otherwise it will default to the claimPage component */}
        {/* leave this at the bottom to prevent going above every other /$/ page */}
        {homepageData === undefined ? (
          <Route
            path={`/$/:maybeCategoryPage`}
            exact
            component={() => (
              <div className="main--empty">
                <Spinner text={__('Loading category...')} />
              </div>
            )}
          />
        ) : (
          <Route path="/$/:nonExistingPage" component={FourOhFourPage} />
        )}

        <Route path="/:claimName" exact component={ClaimPageRender} />
        <Route path="/:claimName/:streamName" exact component={ClaimPageRender} />
        <Route path="/*" component={FourOhFourPage} />
      </Switch>
    </React.Suspense>
  );
}

export default withRouter(AppRouter);
