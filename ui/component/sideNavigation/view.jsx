// @flow
import React from 'react';
import type { Node } from 'react';
import type { HomepageCat } from 'util/buildHomepage';
import classnames from 'classnames';
import * as MODALS from 'constants/modal_types';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import * as KEYCODES from 'constants/keycodes';
import { SIDEBAR_SUBS_DISPLAYED } from 'constants/subscriptions';
import Button from 'component/button';
import ClaimPreviewTitle from 'component/claimPreviewTitle';
import Icon from 'component/common/icon';
import NotificationBubble from 'component/notificationBubble';
import DebouncedInput from 'component/common/debounced-input';
import I18nMessage from 'component/i18nMessage';
import ChannelThumbnail from 'component/channelThumbnail';
import { useIsMobile } from 'effects/use-screensize';
import { platform } from 'util/platform';
import { DOMAIN, ENABLE_UI_NOTIFICATIONS } from 'config';
import MembershipBadge from 'component/membershipBadge';

const touch = platform.isTouch() && /iPad|Android/i.test(navigator.userAgent);

type SideNavLink = {
  title: string,
  icon: string,
  link?: string,
  route?: string,
  onClick?: () => any,
  extra?: Node,
  hideForUnauth?: boolean,
  noI18n?: boolean,
};

const getHomeButton = (additionalAction) => {
  const isEmbed = typeof window !== 'undefined' && window.location.pathname.startsWith('/$/embed');
  const homePath = isEmbed ? '/$/embed/home' : '/';

  return {
    title: 'Home',
    link: homePath,
    icon: ICONS.HOME,
    onClick: () => {
      if (typeof window !== 'undefined' && window.location.pathname === homePath) {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        if (additionalAction) {
          additionalAction();
        }
      }
    },
  };
};

const RECENT_FROM_FOLLOWING = {
  title: 'Following --[sidebar button]--',
  link: `/$/${PAGES.CHANNELS_FOLLOWING}`,
  icon: ICONS.SUBSCRIBE,
};

const NOTIFICATIONS: SideNavLink = {
  title: 'Notifications',
  link: `/$/${PAGES.NOTIFICATIONS}`,
  icon: ICONS.NOTIFICATION,
  extra: <NotificationBubble inline />,
  hideForUnauth: true,
};

const WALLET: SideNavLink = {
  title: 'Wallet',
  link: `/$/${PAGES.WALLET}`,
  icon: ICONS.WALLET,
  hideForUnauth: true,
};

const WATCH_LATER: SideNavLink = {
  title: 'Watch Later',
  link: `/$/${PAGES.PLAYLIST}/watchlater`,
  icon: ICONS.TIME,
  hideForUnauth: true,
};

const FAVORITES: SideNavLink = {
  title: 'Favorites',
  link: `/$/${PAGES.PLAYLIST}/favorites`,
  icon: ICONS.STAR,
  hideForUnauth: true,
};

const PLAYLISTS: SideNavLink = {
  title: 'Playlists',
  link: `/$/${PAGES.PLAYLISTS}`,
  icon: ICONS.PLAYLIST,
  hideForUnauth: true,
};

const WATCH_HISTORY: SideNavLink = {
  title: 'Watch History',
  link: `/$/${PAGES.WATCH_HISTORY}`,
  icon: ICONS.WATCH_HISTORY,
  hideForUnauth: true,
};

const PREMIUM: SideNavLink = {
  title: 'Premium',
  link: `/$/${PAGES.ODYSEE_MEMBERSHIP}`,
  icon: ICONS.UPGRADE,
  hideForUnauth: true,
  noI18n: true,
};

const UNAUTH_LINKS: Array<SideNavLink> = [
  {
    title: 'Log In',
    link: `/$/${PAGES.AUTH_SIGNIN}`,
    icon: ICONS.SIGN_IN,
  },
  {
    title: 'Sign Up',
    link: `/$/${PAGES.AUTH}`,
    icon: ICONS.SIGN_UP,
  },
  {
    title: 'Settings',
    link: `/$/${PAGES.SETTINGS}`,
    icon: ICONS.SETTINGS,
  },
  {
    title: 'Help',
    link: `/$/${PAGES.HELP}`,
    icon: ICONS.HELP,
  },
];

// ****************************************************************************
// ****************************************************************************

// type HomepageOrder = { active: ?Array<string>, hidden: ?Array<string> };

// prettier-ignore
type SidebarCat = $Diff<HomepageCat, {
  id?: string,
  pinnedUrls?: Array<string>,
  pinnedClaimIds?: Array<string>,
  hideSort?: boolean,
  hideByDefault?: boolean,
}>;

type Props = {
  uploadCount: number,
  sidebarOpen: boolean,
  isMediumScreen: boolean,
  isOnFilePage: boolean,
  setSidebarOpen: (boolean) => void,
  // --- select ---
  sidebarCategories: Array<SidebarCat>,
  lastActiveSubs: ?Array<Subscription>,
  followedTags: Array<Tag>,
  email: ?string,
  purchaseSuccess: boolean,
  unseenCount: number,
  user: ?User,
  hasMembership: ?boolean,
  subscriptionUris: Array<string>,
  // --- perform ---
  doClearClaimSearch: () => void,
  doSignOut: () => void,
  doFetchLastActiveSubs: (force?: boolean, count?: number) => void,
  doClearPurchasedUriSuccess: () => void,
  doOpenModal: (id: string, ?{}) => void,
  doGetDisplayedSubs: (filter: string) => Promise<Array<Subscription>>,
  doResolveUris: (uris: Array<string>, cache: boolean) => Promise<any>,
  doBeginPublish: (PublishType) => void,
};

function SideNavigation(props: Props) {
  const {
    sidebarOpen,
    setSidebarOpen,
    isMediumScreen,
    isOnFilePage,
    sidebarCategories: categories,
    lastActiveSubs,
    followedTags,
    email,
    purchaseSuccess,
    unseenCount,
    user,
    hasMembership,
    subscriptionUris,
    doClearClaimSearch,
    doSignOut,
    doFetchLastActiveSubs,
    doClearPurchasedUriSuccess,
    doOpenModal,
    doGetDisplayedSubs,
    doBeginPublish,
  } = props;

  const MOBILE_PUBLISH: Array<SideNavLink> = [
    {
      title: 'Upload',
      icon: ICONS.PUBLISH,
      hideForUnauth: true,
      onClick: () => doBeginPublish('file'),
    },
    {
      title: 'Go Live',
      icon: ICONS.GOLIVE,
      hideForUnauth: true,
      onClick: () => doBeginPublish('livestream'),
    },
    {
      title: 'Post',
      icon: ICONS.POST,
      hideForUnauth: true,
      onClick: () => doBeginPublish('post'),
    },
  ];

  const MOBILE_LINKS: Array<SideNavLink> = [
    {
      title: 'New Channel',
      link: `/$/${PAGES.CHANNEL_NEW}`,
      icon: ICONS.CHANNEL,
      hideForUnauth: true,
    },
    {
      title: 'Sync YouTube Channel',
      link: `/$/${PAGES.YOUTUBE_SYNC}`,
      icon: ICONS.YOUTUBE,
      hideForUnauth: true,
    },
    {
      title: 'Uploads',
      link: `/$/${PAGES.UPLOADS}`,
      icon: ICONS.PUBLISH,
      hideForUnauth: true,
    },

    {
      title: 'Channels',
      link: `/$/${PAGES.CHANNELS}`,
      icon: ICONS.CHANNEL,
      hideForUnauth: true,
    },
    {
      title: 'Creator Analytics',
      link: `/$/${PAGES.CREATOR_DASHBOARD}`,
      icon: ICONS.ANALYTICS,
      hideForUnauth: true,
    },
    {
      title: 'Credits',
      link: `/$/${PAGES.REWARDS}`,
      icon: ICONS.REWARDS,
      hideForUnauth: true,
    },
    {
      title: 'Invites',
      link: `/$/${PAGES.INVITE}`,
      icon: ICONS.INVITE,
      hideForUnauth: true,
    },
    {
      title: 'Settings',
      link: `/$/${PAGES.SETTINGS}`,
      icon: ICONS.SETTINGS,
      hideForUnauth: true,
    },
    {
      title: 'Help',
      link: `/$/${PAGES.HELP}`,
      icon: ICONS.HELP,
      hideForUnauth: true,
    },
    {
      title: 'Sign Out',
      onClick: doSignOut,
      icon: ICONS.SIGN_OUT,
      hideForUnauth: true,
    },
  ];

  const notificationsEnabled = ENABLE_UI_NOTIFICATIONS || (user && user.experimental_ui);
  const isAuthenticated = Boolean(email);

  const [pulseLibrary, setPulseLibrary] = React.useState(false);
  const [expandTags, setExpandTags] = React.useState(false);

  const isPersonalized = !IS_WEB || isAuthenticated;
  const isAbsolute = isOnFilePage || isMediumScreen;
  const isMobile = useIsMobile();

  const [menuInitialized, setMenuInitialized] = React.useState(false);

  const menuCanCloseCompletely = (isOnFilePage && !isMobile) || (isMobile && menuInitialized);
  const hideMenuFromView = menuCanCloseCompletely && !sidebarOpen;

  const [canDisposeMenu, setCanDisposeMenu] = React.useState(false);

  const shouldRenderLargeMenu = (menuCanCloseCompletely && !isAbsolute) || sidebarOpen;

  const sideNavigationRef = React.useRef(null);

  const showMicroMenu = !sidebarOpen && !menuCanCloseCompletely;
  const showPushMenu = !menuCanCloseCompletely;
  const showOverlay = sidebarOpen;

  const showTagSection = sidebarOpen && isPersonalized && followedTags && followedTags.length;

  const [subscriptionFilter, setSubscriptionFilter] = React.useState('');
  const [displayedSubs, setDisplayedSubs] = React.useState([]);
  const showSubsSection = shouldRenderLargeMenu && isPersonalized && subscriptionUris?.length > 0;

  let displayedFollowedTags = followedTags;
  if (showTagSection && followedTags.length > SIDEBAR_SUBS_DISPLAYED && !expandTags) {
    displayedFollowedTags = followedTags.slice(0, SIDEBAR_SUBS_DISPLAYED);
  }

  // **************************************************************************
  // **************************************************************************

  function getLink(props: SideNavLink) {
    const { hideForUnauth, route, link, noI18n, ...passedProps } = props;
    const { title, icon, extra } = passedProps;

    if (hideForUnauth && !email) {
      return null;
    }

    return (
      <li key={route || link || title}>
        <Button
          {...passedProps}
          icon={icon}
          navigate={route || link}
          label={noI18n ? title : __(title)}
          title={noI18n ? title : __(title)}
          className={classnames('navigation-link', {
            'navigation-link--pulse': icon === ICONS.LIBRARY && pulseLibrary,
            'navigation-link--highlighted': icon === ICONS.NOTIFICATION && unseenCount > 0,
          })}
          activeClass="navigation-link--active"
        />
        {extra && extra}
      </li>
    );
  }

  function getCategoryLink(props: SidebarCat) {
    const { id, title, route, link, icon } = props;

    if (id === 'UPCOMING') {
      return null;
    }

    return (
      <li key={route || link || title}>
        <Button
          icon={icon}
          navigate={route || link}
          label={__(title)}
          title={__(title)}
          className="navigation-link"
          activeClass="navigation-link--active"
        />
      </li>
    );
  }

  function getSubscriptionSection() {
    if (showSubsSection) {
      if (lastActiveSubs === undefined) {
        return null; // Don't show yet, just wait to save some renders
      }

      return (
        <ul className="navigation__secondary navigation-links">
          {!showMicroMenu && (
            <SectionHeader
              title={__('Following')}
              actionTooltip={__('Manage')}
              navigate={!subscriptionFilter ? `/$/${PAGES.CHANNELS_FOLLOWING_MANAGE}` : ''}
            />
          )}
          {subscriptionUris.length > SIDEBAR_SUBS_DISPLAYED && (
            <li className="navigation-item">
              <DebouncedInput icon={ICONS.SEARCH} placeholder={__('Filter')} onChange={setSubscriptionFilter} />
            </li>
          )}
          {displayedSubs.map((sub) => (
            <SubscriptionListItem key={sub.uri} subscription={sub} />
          ))}
          {subscriptionUris.length > SIDEBAR_SUBS_DISPLAYED && (
            <li className="navigation-item">
              <Button
                icon={ICONS.MORE}
                title={__('Manage Following')}
                navigate={`/$/${PAGES.CHANNELS_FOLLOWING_MANAGE}`}
                className="navigation-link navigation-link--icon-centered"
                activeClass="navigation-link--active"
              />
            </li>
          )}
          {!!subscriptionFilter && !displayedSubs.length && (
            <li>
              <div className="navigation-item">
                <div className="empty empty--centered">{__('No results')}</div>
              </div>
            </li>
          )}
        </ul>
      );
    }
    return null;
  }

  function getFollowedTagsSection() {
    if (showTagSection) {
      return (
        <ul className="navigation__secondary navigation-links">
          {!showMicroMenu && (
            <SectionHeader
              title={__('Tags')}
              actionTooltip={__('Manage')}
              navigate={!subscriptionFilter ? `/$/${PAGES.TAGS_FOLLOWING_MANAGE}` : ''}
            />
          )}
          <li key="all" className="navigation-link__wrapper">
            <Button navigate={`/$/tags`} label={__('View all')} className="navigation-link" />
          </li>
          {displayedFollowedTags.map(({ name }, key) => (
            <li key={name} className="navigation-link__wrapper">
              <Button navigate={`/$/discover?t=${name}`} label={`#${name}`} className="navigation-link" />
            </li>
          ))}
          {followedTags.length > SIDEBAR_SUBS_DISPLAYED && (
            <Button
              key="showMore"
              label={expandTags ? __('Show less') : __('Show more')}
              className="navigation-link"
              onClick={() => setExpandTags(!expandTags)}
            />
          )}
        </ul>
      );
    }
    return null;
  }

  // **************************************************************************
  // **************************************************************************

  React.useEffect(() => {
    // $FlowFixMe
    document.body.style.overflowY = showOverlay ? 'hidden' : '';
    return () => {
      // $FlowFixMe
      document.body.style.overflowY = '';
    };
  }, [showOverlay]);

  React.useEffect(() => {
    if (purchaseSuccess) {
      setPulseLibrary(true);

      let timeout = setTimeout(() => {
        setPulseLibrary(false);
        doClearPurchasedUriSuccess();
      }, 2500);

      return () => clearTimeout(timeout);
    }
  }, [setPulseLibrary, purchaseSuccess, doClearPurchasedUriSuccess]);

  React.useEffect(() => {
    function handleKeydown(e: SyntheticKeyboardEvent<*>) {
      if (e.keyCode === KEYCODES.ESCAPE && isAbsolute) {
        setSidebarOpen(false);
      } else if (e.keyCode === KEYCODES.BACKSLASH) {
        const hasActiveInput = document.querySelector('input:focus, textarea:focus');
        if (!hasActiveInput) {
          setSidebarOpen(!sidebarOpen);
        }
      }
    }

    function handleOutsideClick(e) {
      if (sidebarOpen && e) {
        const navigationButton = document.querySelector('#navigation-button');
        if (e.target === navigationButton || (navigationButton && navigationButton.contains(e.target))) {
          if (sideNavigationRef.current === null || sideNavigationRef.current.contains(e.target)) {
            setSidebarOpen(false);
          }
        } else {
          if (e.target.tagName !== 'INPUT') {
            setTimeout(() => {
              setSidebarOpen(false);
            }, 0);
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('mouseup', handleOutsideClick);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('mouseup', handleOutsideClick);
    };
  }, [sidebarOpen, setSidebarOpen, isAbsolute]);

  React.useEffect(() => {
    if (!window.Optanon) {
      const gdprDiv = document.getElementById('gdprSidebarLink');
      if (gdprDiv) {
        gdprDiv.style.display = 'none';
      }
    }
  }, [sidebarOpen, isMobile]);

  React.useEffect(() => {
    if (hideMenuFromView || !menuInitialized) {
      const handler = setTimeout(() => {
        setMenuInitialized(true);
        if (hideMenuFromView) {
          setCanDisposeMenu(true);
        }
      }, 250);
      return () => {
        clearTimeout(handler);
      };
    } else {
      setCanDisposeMenu(false);
    }
  }, [hideMenuFromView, menuInitialized]);

  React.useEffect(() => {
    if (sidebarOpen) {
      doFetchLastActiveSubs();
    }
  }, [doFetchLastActiveSubs, sidebarOpen]);

  React.useEffect(() => {
    if (showSubsSection) {
      // Done this way to avoid over-render from claimsByUris[].
      doGetDisplayedSubs(subscriptionFilter).then((result) => setDisplayedSubs(result));
    }
  }, [subscriptionFilter, showSubsSection, doGetDisplayedSubs]);

  // **************************************************************************
  // **************************************************************************

  type SectionHeaderProps = { title: string, actionTooltip?: string, onClick?: any, navigate?: string };
  const SectionHeader = ({ title, actionTooltip, onClick, navigate }: SectionHeaderProps) => {
    return (
      <div className="navigation-section-header">
        <span>{title}</span>
        {(onClick || navigate) && (
          <Button
            button="link"
            iconRight={ICONS.SETTINGS}
            onClick={onClick}
            navigate={navigate}
            title={actionTooltip}
          />
        )}
      </div>
    );
  };

  const unAuthNudge =
    DOMAIN === 'lbry.tv' ? null : (
      <div className="navigation__auth-nudge">
        <span>
          <I18nMessage tokens={{ lbc: <Icon icon={ICONS.LBC} /> }}>Sign up to receive %lbc%.</I18nMessage>
        </span>
        <Button
          button="secondary"
          label={__('Sign Up')}
          navigate={`/$/${PAGES.AUTH}?src=sidenav_nudge`}
          disabled={user === null}
        />{' '}
      </div>
    );

  const helpLinks = (
    <ul className="navigation__tertiary navigation-links--small">
      <li className="navigation-link">
        <Button label={__('FAQ and Support')} href="https://help.odysee.tv/" target="_blank" />
      </li>
      <li className="navigation-link">
        <Button label={__('Community Guidelines')} href="https://help.odysee.tv/communityguidelines/" target="_blank" />
      </li>
      <li className="navigation-link">
        <Button label={__('Careers')} navigate={`/$/${PAGES.CAREERS}`} />
      </li>
      <li className="navigation-link">
        <Button label={__('Terms')} href="https://odysee.com/$/tos" />
      </li>
      <li className="navigation-link">
        <Button label={__('Privacy Policy')} href="https://odysee.com/$/privacypolicy" />
      </li>
      <li className="navigation-link" id="gdprSidebarLink">
        <Button label={__('Cookie Settings')} onClick={() => window.Optanon && window.Optanon.ToggleInfoDisplay()} />
      </li>
    </ul>
  );

  // **************************************************************************
  // **************************************************************************

  return (
    <div
      className={classnames('navigation__wrapper', {
        'navigation__wrapper--micro': showMicroMenu,
        'navigation__wrapper--absolute': isAbsolute,
      })}
      ref={sideNavigationRef}
    >
      <nav
        aria-label={'Sidebar'}
        className={classnames('navigation', {
          'navigation--micro': showMicroMenu,
          'navigation--push': showPushMenu,
          'navigation-file-page-and-mobile': hideMenuFromView,
          'navigation-touch': touch,
        })}
      >
        {(!canDisposeMenu || sidebarOpen) && (
          <div className="navigation-inner-container">
            <ul className="navigation-links--absolute mobile-only">
              {notificationsEnabled && getLink(NOTIFICATIONS)}
              {getLink(WALLET)}
            </ul>

            <ul
              className={classnames('navigation-links', {
                'navigation-links--micro': showMicroMenu,
                'navigation-links--absolute': shouldRenderLargeMenu,
              })}
            >
              {getLink(getHomeButton(doClearClaimSearch))}
              {getLink(RECENT_FROM_FOLLOWING)}
              {!hasMembership && getLink(PREMIUM)}
            </ul>
            <ul className="navigation-links--absolute mobile-only">
              {email && MOBILE_PUBLISH.map((linkProps) => getLink(linkProps))}
            </ul>
            <ul
              className={classnames('navigation-links', {
                'navigation-links--micro': showMicroMenu,
                'navigation-links--absolute': shouldRenderLargeMenu,
              })}
            >
              {!showMicroMenu && email && <SectionHeader title={__('Lists')} />}
              {!showMicroMenu && getLink(WATCH_LATER)}
              {!showMicroMenu && getLink(FAVORITES)}
              {getLink(PLAYLISTS)}
              {!showMicroMenu && getLink(WATCH_HISTORY)}
            </ul>

            <ul
              className={classnames('navigation-links', {
                'navigation-links--micro': showMicroMenu,
                'navigation-links--absolute': shouldRenderLargeMenu,
              })}
            >
              {categories && (
                <>
                  {!showMicroMenu && (
                    <SectionHeader
                      title={__('Categories')}
                      onClick={() => doOpenModal(MODALS.CUSTOMIZE_HOMEPAGE)}
                      actionTooltip={__('Sort and customize your homepage')}
                    />
                  )}
                  {categories.map((linkProps) => getCategoryLink(linkProps))}
                </>
              )}
            </ul>

            <ul className="navigation-links--absolute mobile-only">
              {email && MOBILE_LINKS.map((linkProps) => getLink(linkProps))}
              {!email && UNAUTH_LINKS.map((linkProps) => getLink(linkProps))}
            </ul>

            {getSubscriptionSection()}
            {getFollowedTagsSection()}
            {!isAuthenticated && sidebarOpen && unAuthNudge}
          </div>
        )}
        {(!canDisposeMenu || sidebarOpen) && shouldRenderLargeMenu && helpLinks}
      </nav>
      <div
        className={classnames('navigation__overlay', {
          'navigation__overlay--active': showOverlay,
        })}
        onClick={() => setSidebarOpen(false)}
      />
    </div>
  );
}

// ****************************************************************************
// SubscriptionListItem
// ****************************************************************************

type SubItemProps = {
  subscription: Subscription,
};

function SubscriptionListItem(props: SubItemProps) {
  const { subscription } = props;
  const { uri, channelName } = subscription;

  return (
    <li className="navigation-link__wrapper navigation__subscription">
      <Button
        navigate={uri}
        className="navigation-link navigation-link--with-thumbnail"
        activeClass="navigation-link--active"
      >
        <ChannelThumbnail xsmall uri={uri} hideStakedIndicator />
        <div className="navigation__subscription-title">
          <ClaimPreviewTitle uri={uri} />
          <span dir="auto" className="channel-name">
            {channelName}
            <MembershipBadge uri={uri} />
          </span>
        </div>
      </Button>
    </li>
  );
}

export default SideNavigation;
