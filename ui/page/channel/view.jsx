// @flow
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import React from 'react';
import { getChannelSubCountStr } from 'util/formatMediaDuration';
import { parseURI } from 'util/lbryURI';
import { YOUTUBE_STATUSES } from 'lbryinc';
import Page from 'component/page';
import SubscribeButton from 'component/subscribeButton';
import ClaimShareButton from 'component/claimShareButton';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import { useHistory } from 'react-router';
import Button from 'component/button';
import { formatLbryUrlForWeb } from 'util/url';
import { CHANNEL_PAGE } from 'constants/urlParams';
import ChannelThumbnail from 'component/channelThumbnail';
import ChannelEdit from 'component/channelEdit';
import SectionList from 'component/channelSections/SectionList';
import classnames from 'classnames';
import HelpLink from 'component/common/help-link';
import ClaimSupportButton from 'component/claimSupportButton';
import ClaimMenuList from 'component/claimMenuList';
// import OptimizedImage from 'component/optimizedImage';
import Yrbl from 'component/yrbl';
import I18nMessage from 'component/i18nMessage';
import TruncatedText from 'component/common/truncated-text';
// $FlowFixMe cannot resolve ...
// import PlaceholderTx from 'static/img/placeholderTx.gif';
import Tooltip from 'component/common/tooltip';
import { toCompactNotation } from 'util/string';
import MembershipBadge from 'component/membershipBadge';
import JoinMembershipButton from 'component/joinMembershipButton';

import HomeTab from './tabs/homeTab';
import ContentTab from './tabs/contentTab';
import MembershipTab from './tabs/membershipTab';
import CommunityTab from './tabs/communityTab';
import AboutTab from './tabs/aboutTab';
import CreatorSettingsTab from './tabs/creatorSettingsTab';
import * as CS from 'constants/claim_search';

const TABS_FOR_CHANNELS_WITH_CONTENT = [
  CHANNEL_PAGE.VIEWS.HOME,
  CHANNEL_PAGE.VIEWS.CONTENT,
  CHANNEL_PAGE.VIEWS.PLAYLISTS,
  CHANNEL_PAGE.VIEWS.CHANNELS,
];

type Props = {
  uri: string,
  claim: ChannelClaim,
  title: ?string,
  coverUrl: ?string,
  thumbnail: ?string,
  match: { params: { attribute: ?string } },
  channelIsMine: boolean,
  isSubscribed: boolean,
  channelIsBlocked: boolean,
  blackListedOutpointMap: { [string]: number },
  fetchSubCount: (string) => void,
  subCount: number,
  pending: boolean,
  youtubeChannels: ?Array<{ channel_claim_id: string, sync_status: string, transfer_state: string }>,
  blockedChannels: Array<string>,
  mutedChannels: Array<string>,
  unpublishedCollections: CollectionGroup,
  lang: string,
  odyseeMembership: ?string,
  getMembershipTiersForChannel: any,
  doMembershipMine: () => void,
  myMembershipsFetched: boolean,
  isOdyseeChannel: boolean,
  preferEmbed: boolean,
  banState: any,
};

export const ChannelPageContext = React.createContext<any>();

function ChannelPage(props: Props) {
  const {
    uri,
    claim,
    title,
    coverUrl,
    channelIsMine,
    isSubscribed,
    blackListedOutpointMap,
    fetchSubCount,
    subCount,
    pending,
    youtubeChannels,
    blockedChannels,
    mutedChannels,
    unpublishedCollections,
    lang,
    odyseeMembership,
    getMembershipTiersForChannel,
    doMembershipMine,
    myMembershipsFetched,
    isOdyseeChannel,
    preferEmbed,
    banState,
  } = props;
  const {
    push,
    goBack,
    location: { search },
  } = useHistory();
  const { meta } = claim;
  const { claims_in_channel } = meta;
  const showClaims = Boolean(claims_in_channel) && !preferEmbed && !banState.filtered && !banState.blacklisted;

  const [viewBlockedChannel, setViewBlockedChannel] = React.useState(false);

  const urlParams = new URLSearchParams(search);
  const viewParam = urlParams.get(CHANNEL_PAGE.QUERIES.VIEW);
  const isHomeTab = !viewParam;
  const currentView =
    !showClaims && !channelIsMine && (isHomeTab || TABS_FOR_CHANNELS_WITH_CONTENT.includes(viewParam))
      ? CHANNEL_PAGE.VIEWS.ABOUT
      : viewParam;

  const [discussionWasMounted, setDiscussionWasMounted] = React.useState(false);
  const editing = currentView === CHANNEL_PAGE.VIEWS.EDIT;
  const { channelName } = parseURI(uri);
  const { permanent_url: permanentUrl } = claim;
  const claimId = claim.claim_id;
  const compactSubCount = toCompactNotation(subCount, lang, 10000);
  const formattedSubCount = Number(subCount).toLocaleString();
  const isBlocked = claim && blockedChannels.includes(claim.permanent_url);
  const isMuted = claim && mutedChannels.includes(claim.permanent_url);
  const isMyYouTubeChannel =
    claim &&
    youtubeChannels &&
    youtubeChannels.some(({ channel_claim_id, sync_status, transfer_state }) => {
      if (
        channel_claim_id === claim.claim_id &&
        sync_status !== YOUTUBE_STATUSES.YOUTUBE_SYNC_ABANDONDED &&
        transfer_state !== YOUTUBE_STATUSES.YOUTUBE_SYNC_COMPLETED_TRANSFER
      ) {
        return true;
      }
    });
  const showDiscussion = React.useMemo(() => {
    if (discussionWasMounted && currentView !== CHANNEL_PAGE.VIEWS.DISCUSSION) {
      setDiscussionWasMounted(false);
    }

    return discussionWasMounted && currentView === CHANNEL_PAGE.VIEWS.DISCUSSION;
  }, [discussionWasMounted, uri]);

  const hasUnpublishedCollections = unpublishedCollections && Object.keys(unpublishedCollections).length;
  const [filters, setFilters] = React.useState(undefined);

  const [legacyHeader, setLegacyHeader] = React.useState(false);
  React.useEffect(() => {
    const image = new Image();
    if (coverUrl) {
      image.src = coverUrl;
      image.onload = function () {
        if (image.naturalWidth / image.naturalHeight < 2) {
          setLegacyHeader(true);
        }
      };
    }
  }, [coverUrl]);

  const [scrollPast, setScrollPast] = React.useState(0);
  const onScroll = () => {
    if (window.pageYOffset > 240) {
      setScrollPast(true);
    } else {
      setScrollPast(false);
    }
  };
  React.useEffect(() => {
    window.addEventListener('scroll', onScroll, {
      passive: true,
    });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  let collectionEmpty;
  if (channelIsMine) {
    collectionEmpty = hasUnpublishedCollections ? (
      <section className="main--empty">
        {
          <p>
            <I18nMessage
              tokens={{
                pick: <Button button="link" navigate={`/$/${PAGES.PLAYLISTS}`} label={__('Pick')} />,
              }}
            >
              You have unpublished playlists! %pick% one and publish it!
            </I18nMessage>
          </p>
        }
      </section>
    ) : (
      <section className="main--empty">{__('You have no playlists! Create one from any playable content.')}</section>
    );
  } else {
    collectionEmpty = <section className="main--empty">{__('No Playlists found')}</section>;
  }

  let channelIsBlackListed = false;

  if (claim && blackListedOutpointMap) {
    channelIsBlackListed = blackListedOutpointMap[`${claim.txid}:${claim.nout}`];
  }

  // If a user changes tabs, update the url so it stays on the same page if they refresh.
  // We don't want to use links here because we can't animate the tab change and using links
  // would alter the Tab label's role attribute, which should stay role="tab" to work with keyboards/screen readers.
  let tabIndex;
  switch (currentView) {
    case CHANNEL_PAGE.VIEWS.HOME:
      tabIndex = 0;
      break;
    case CHANNEL_PAGE.VIEWS.CONTENT:
      tabIndex = 1;
      break;
    case CHANNEL_PAGE.VIEWS.PLAYLISTS:
      tabIndex = 2;
      break;
    case CHANNEL_PAGE.VIEWS.CHANNELS:
      tabIndex = 3;
      break;
    case CHANNEL_PAGE.VIEWS.MEMBERSHIP:
      if (!isOdyseeChannel) tabIndex = 4;
      break;
    case CHANNEL_PAGE.VIEWS.DISCUSSION:
      tabIndex = 5;
      break;
    case CHANNEL_PAGE.VIEWS.ABOUT:
      tabIndex = 6;
      break;
    case CHANNEL_PAGE.VIEWS.SETTINGS:
      tabIndex = 7;
      break;
    default:
      tabIndex = showClaims || channelIsMine ? 0 : CHANNEL_PAGE.VIEWS.ABOUT;
      break;
  }

  function onTabChange(newTabIndex, keepFilters) {
    const url = formatLbryUrlForWeb(uri);
    let search = '';

    if (!keepFilters) setFilters(undefined);

    switch (newTabIndex) {
      case 0:
        search += `?${CHANNEL_PAGE.QUERIES.VIEW}=${CHANNEL_PAGE.VIEWS.HOME}`;
        break;
      case 1:
        search += `?${CHANNEL_PAGE.QUERIES.VIEW}=${CHANNEL_PAGE.VIEWS.CONTENT}`;
        break;
      case 2:
        search += `?${CHANNEL_PAGE.QUERIES.VIEW}=${CHANNEL_PAGE.VIEWS.PLAYLISTS}`;
        break;
      case 3:
        search += `?${CHANNEL_PAGE.QUERIES.VIEW}=${CHANNEL_PAGE.VIEWS.CHANNELS}`;
        break;
      case 4:
        if (!isOdyseeChannel) {
          search += `?${CHANNEL_PAGE.QUERIES.VIEW}=${CHANNEL_PAGE.VIEWS.MEMBERSHIP}`;
        }
        break;
      case 5:
        search += `?${CHANNEL_PAGE.QUERIES.VIEW}=${CHANNEL_PAGE.VIEWS.DISCUSSION}`;
        break;
      case 6:
        search += `?${CHANNEL_PAGE.QUERIES.VIEW}=${CHANNEL_PAGE.VIEWS.ABOUT}`;
        break;
      case 7:
        search += `?${CHANNEL_PAGE.QUERIES.VIEW}=${CHANNEL_PAGE.VIEWS.SETTINGS}`;
        break;
    }
    push(`${url}${search}`);
  }

  React.useEffect(() => {
    if (currentView === CHANNEL_PAGE.VIEWS.DISCUSSION) {
      setDiscussionWasMounted(true);
    }
  }, [currentView]);

  React.useEffect(() => {
    if (claim) getMembershipTiersForChannel(claim.claim_id);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim]);

  React.useEffect(() => {
    fetchSubCount(claimId);
  }, [uri, fetchSubCount, claimId]);

  React.useEffect(() => {
    if (!myMembershipsFetched) {
      doMembershipMine();
    }
  }, [doMembershipMine, myMembershipsFetched]);

  if (editing) {
    return (
      <Page className="channelPage-wrapper channelPage-edit-wrapper" noFooter fullWidthPage>
        <ChannelEdit uri={uri} onDone={() => goBack()} />
      </Page>
    );
  }

  function handleViewMore(section) {
    function getOrderBy() {
      return section.order_by && section.order_by[0] === 'trending_group'
        ? CS.ORDER_BY_TRENDING
        : section.order_by[0] === 'effective_amount'
        ? CS.ORDER_BY_TOP
        : CS.ORDER_BY_NEW;
    }
    function getFileType() {
      return section.file_type && section.file_type.length === 1 && section.file_type[0] === 'video'
        ? CS.FILE_VIDEO
        : section.file_type &&
          section.file_type.length === 1 &&
          section.file_type[0] &&
          section.file_type[0] === 'audio'
        ? CS.FILE_AUDIO
        : section.file_type &&
          section.file_type.length === 1 &&
          section.file_type[0] &&
          section.file_type[0] === 'document'
        ? CS.FILE_DOCUMENT
        : section.file_type &&
          section.file_type.length === 1 &&
          section.file_type[0] &&
          section.file_type[0] === 'image'
        ? CS.FILE_IMAGE
        : undefined;
    }

    switch (section.type) {
      case 'content':
        setFilters({ order_by: getOrderBy(), file_type: getFileType() });
        onTabChange(1, true);
        break;
      case 'playlist':
        push(`/$/playlist/${section.claim_id}`);
        break;
      case 'playlists':
        setFilters({ order_by: getOrderBy(), file_type: getFileType() });
        onTabChange(2, true);
        break;
      case 'channels':
        onTabChange(3, true);
        break;
    }
  }

  return (
    <Page className="channelPage-wrapper" noFooter fullWidthPage>
      <ChannelPageContext.Provider value>
        <header
          className={classnames('channel-cover', { 'channel-cover-legacy': legacyHeader })}
          style={coverUrl && { backgroundImage: 'url(' + String(coverUrl) + ')' }}
        >
          <div className="channel-header-content">
            <div className="channel__quick-actions">
              {isMyYouTubeChannel && (
                <Button
                  button="alt"
                  label={__('Claim Your Channel')}
                  icon={ICONS.YOUTUBE}
                  navigate={`/$/${PAGES.CHANNELS}`}
                />
              )}
              <JoinMembershipButton uri={uri} />
              {!channelIsBlackListed && <ClaimShareButton uri={uri} webShareable />}
              {!(isBlocked || isMuted) && <ClaimSupportButton uri={uri} />}
              {!(isBlocked || isMuted) && (!channelIsBlackListed || isSubscribed) && (
                <SubscribeButton uri={permanentUrl} />
              )}
              <ClaimMenuList uri={claim.permanent_url} inline />
            </div>
            <div className="channel__primary-info">
              <h1 className="channel__title">
                <TruncatedText text={title || (channelName && '@' + channelName)} lines={2} showTooltip />
                {odyseeMembership && <MembershipBadge membershipName={odyseeMembership} />}
              </h1>
              <div className="channel__meta">
                <Tooltip title={formattedSubCount} followCursor placement="top">
                  <span>
                    {getChannelSubCountStr(subCount, compactSubCount)}
                    {Number.isInteger(subCount) ? (
                      <HelpLink href="https://help.odysee.tv/category-interaction/following/" />
                    ) : (
                      '\u00A0'
                    )}
                  </span>
                </Tooltip>
              </div>
              <div className="channel__edit">
                {channelIsMine && (
                  <>
                    {pending ? (
                      <span>{__('Your changes will be live in a few minutes')}</span>
                    ) : (
                      <Button
                        button="alt"
                        title={__('Edit')}
                        onClick={() => push(`?${CHANNEL_PAGE.QUERIES.VIEW}=${CHANNEL_PAGE.VIEWS.EDIT}`)}
                        icon={ICONS.EDIT}
                        iconSize={18}
                        disabled={pending}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {(isBlocked || isMuted) && !viewBlockedChannel ? (
          <div className="main--empty">
            <Yrbl
              title={isBlocked ? __('This channel is blocked') : __('This channel is muted')}
              subtitle={
                isBlocked
                  ? __('Are you sure you want to view this content? Viewing will not unblock @%channel%', {
                      channel: channelName,
                    })
                  : __('Are you sure you want to view this content? Viewing will not unmute @%channel%', {
                      channel: channelName,
                    })
              }
              actions={
                <div className="section__actions">
                  <Button button="primary" label={__('View Content')} onClick={() => setViewBlockedChannel(true)} />
                </div>
              }
            />
          </div>
        ) : (
          <Tabs onChange={onTabChange} index={tabIndex}>
            <div className={classnames('tab__wrapper', { 'tab__wrapper-fixed': scrollPast })}>
              <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <ChannelThumbnail
                  className={classnames('channel__thumbnail--channel-page', {
                    'channel__thumbnail--channel-page-fixed': scrollPast,
                  })}
                  uri={uri}
                  allowGifs
                  isChannel
                  hideStakedIndicator
                />
              </div>
              <TabList>
                <Tab aria-selected={tabIndex === 0} disabled={editing || !showClaims} onClick={() => onTabChange(0)}>
                  {__('Home')}
                </Tab>
                <Tab aria-selected={tabIndex === 1} disabled={editing || !showClaims} onClick={() => onTabChange(1)}>
                  {__('Content')}
                </Tab>
                <Tab aria-selected={tabIndex === 2} disabled={editing || !showClaims} onClick={() => onTabChange(2)}>
                  {__('Playlists')}
                </Tab>
                <Tab aria-selected={tabIndex === 3} disabled={editing || !showClaims} onClick={() => onTabChange(3)}>
                  {__('Channels')}
                </Tab>
                <Tab
                  className="tab--membership"
                  aria-selected={tabIndex === 4}
                  disabled={editing || isOdyseeChannel}
                  onClick={() => onTabChange(4)}
                >
                  {__('Membership')}
                </Tab>
                <Tab aria-selected={tabIndex === 5} disabled={editing} onClick={() => onTabChange(5)}>
                  {__('Community')}
                </Tab>
                <Tab aria-selected={tabIndex === 6} onClick={() => onTabChange(6)}>
                  {editing ? __('Editing Your Channel') : __('About --[tab title in Channel Page]--')}
                </Tab>
                <Tab aria-selected={tabIndex === 7} disabled={editing} onClick={() => onTabChange(7)}>
                  {channelIsMine && __('Settings')}
                </Tab>
              </TabList>
            </div>
            <TabPanels>
              <TabPanel>
                <HomeTab uri={uri} editMode={channelIsMine} handleViewMore={(e) => handleViewMore(e)} />
              </TabPanel>
              <TabPanel>
                {currentView === CHANNEL_PAGE.VIEWS.CONTENT && (
                  <ContentTab
                    uri={uri}
                    channelIsBlackListed={channelIsBlackListed}
                    viewHiddenChannels
                    claimType={['stream', 'repost']}
                    empty={<section className="main--empty">{__('No Content Found')}</section>}
                    filters={filters}
                  />
                )}
              </TabPanel>
              <TabPanel>
                {currentView === CHANNEL_PAGE.VIEWS.PLAYLISTS && (
                  <ContentTab
                    claimType={'collection'}
                    uri={uri}
                    channelIsBlackListed={channelIsBlackListed}
                    viewHiddenChannels
                    empty={collectionEmpty}
                  />
                )}
              </TabPanel>
              <TabPanel>
                {currentView === CHANNEL_PAGE.VIEWS.CHANNELS && <SectionList uri={uri} editMode={channelIsMine} />}
              </TabPanel>
              <TabPanel>
                {currentView === CHANNEL_PAGE.VIEWS.MEMBERSHIP && !isOdyseeChannel && <MembershipTab uri={uri} />}
              </TabPanel>
              <TabPanel>
                {(showDiscussion || currentView === CHANNEL_PAGE.VIEWS.DISCUSSION) && <CommunityTab uri={uri} />}
              </TabPanel>
              <TabPanel>
                {currentView === CHANNEL_PAGE.VIEWS.ABOUT && (
                  <AboutTab uri={uri} channelIsBlackListed={channelIsBlackListed} />
                )}
              </TabPanel>
              <TabPanel>{channelIsMine && <CreatorSettingsTab activeChannelClaim={claim} />}</TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </ChannelPageContext.Provider>
    </Page>
  );
}

export default ChannelPage;
