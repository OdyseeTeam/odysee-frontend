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
import ChannelContent from 'component/channelContent';
import ChannelAbout from 'component/channelAbout';
import ChannelDiscussion from 'component/channelDiscussion';
import ChannelThumbnail from 'component/channelThumbnail';
import ChannelEdit from 'component/channelEdit';
import SectionList from 'component/channelSections/SectionList';
import classnames from 'classnames';
import HelpLink from 'component/common/help-link';
import ClaimSupportButton from 'component/claimSupportButton';
import ClaimMenuList from 'component/claimMenuList';
import OptimizedImage from 'component/optimizedImage';
import Yrbl from 'component/yrbl';
import I18nMessage from 'component/i18nMessage';
import TruncatedText from 'component/common/truncated-text';
// $FlowFixMe cannot resolve ...
import PlaceholderTx from 'static/img/placeholderTx.gif';
import Tooltip from 'component/common/tooltip';
import { toCompactNotation } from 'util/string';
import MembershipBadge from 'component/membershipBadge';
import JoinMembershipButton from 'component/joinMembershipButton';
import MembershipChannelTab from './internal/membershipChannelTab';

type Props = {
  uri: string,
  claim: ChannelClaim,
  title: ?string,
  cover: ?string,
  thumbnail: ?string,
  page: number,
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
};

export const ChannelPageContext = React.createContext<any>();

function ChannelPage(props: Props) {
  const {
    uri,
    claim,
    title,
    cover,
    // page, ?page= may come back some day?
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
  } = props;
  const {
    push,
    goBack,
    location: { search },
  } = useHistory();
  const [viewBlockedChannel, setViewBlockedChannel] = React.useState(false);
  const urlParams = new URLSearchParams(search);
  const currentView = urlParams.get(CHANNEL_PAGE.QUERIES.VIEW) || CHANNEL_PAGE.VIEWS.CONTENT;
  const [discussionWasMounted, setDiscussionWasMounted] = React.useState(false);
  const editing = urlParams.get(CHANNEL_PAGE.QUERIES.VIEW) === CHANNEL_PAGE.VIEWS.EDIT;
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

    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-calculate on discussionWasMounted or uri change
  }, [discussionWasMounted, uri]);

  const hasUnpublishedCollections = unpublishedCollections && Object.keys(unpublishedCollections).length;

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
              You have unpublished lists! %pick% one and publish it!
            </I18nMessage>
          </p>
        }
      </section>
    ) : (
      <section className="main--empty">{__('You have no lists! Create one from any playable content.')}</section>
    );
  } else {
    collectionEmpty = <section className="main--empty">{__('No Lists Found')}</section>;
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
    case CHANNEL_PAGE.VIEWS.CONTENT:
      tabIndex = 0;
      break;
    case CHANNEL_PAGE.VIEWS.LISTS:
      tabIndex = 1;
      break;
    case CHANNEL_PAGE.VIEWS.CHANNELS:
      tabIndex = 2;
      break;
    case CHANNEL_PAGE.VIEWS.MEMBERSHIP:
      if (!isOdyseeChannel) tabIndex = 3;
      break;
    case CHANNEL_PAGE.VIEWS.DISCUSSION:
      tabIndex = 4;
      break;
    case CHANNEL_PAGE.VIEWS.ABOUT:
      tabIndex = 5;
      break;
    default:
      tabIndex = 0;
      break;
  }

  function onTabChange(newTabIndex) {
    const url = formatLbryUrlForWeb(uri);
    let search = '?';

    switch (newTabIndex) {
      case 0:
        search += `${CHANNEL_PAGE.QUERIES.VIEW}=${CHANNEL_PAGE.VIEWS.CONTENT}`;
        break;
      case 1:
        search += `${CHANNEL_PAGE.QUERIES.VIEW}=${CHANNEL_PAGE.VIEWS.LISTS}`;
        break;
      case 2:
        search += `${CHANNEL_PAGE.QUERIES.VIEW}=${CHANNEL_PAGE.VIEWS.CHANNELS}`;
        break;
      case 3:
        if (!isOdyseeChannel) search += `${CHANNEL_PAGE.QUERIES.VIEW}=${CHANNEL_PAGE.VIEWS.MEMBERSHIP}`;
        break;
      case 4:
        search += `${CHANNEL_PAGE.QUERIES.VIEW}=${CHANNEL_PAGE.VIEWS.DISCUSSION}`;
        break;
      case 5:
        search += `${CHANNEL_PAGE.QUERIES.VIEW}=${CHANNEL_PAGE.VIEWS.ABOUT}`;
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
      <Page
        noFooter
        noSideNavigation={editing}
        backout={{
          title: __('Editing @%channel%', { channel: channelName }),
          simpleTitle: __('Editing'),
        }}
      >
        <ChannelEdit uri={uri} onDone={() => goBack()} />
      </Page>
    );
  }

  return (
    <Page className="channelPage-wrapper" noFooter>
      <ChannelPageContext.Provider value>
        <header className="channel-cover">
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
            {/* TODO: add channel collections <ClaimCollectionAddButton uri={uri} fileAction /> */}
            <ClaimMenuList uri={claim.permanent_url} inline />
          </div>
          {cover && <img className={classnames('channel-cover__custom')} src={PlaceholderTx} />}
          {cover && <OptimizedImage className={classnames('channel-cover__custom')} src={cover} />}
          <div className="channel__primary-info">
            <ChannelThumbnail
              className="channel__thumbnail--channel-page"
              uri={uri}
              allowGifs
              isChannel
              hideStakedIndicator
            />
            <h1 className="channel__title">
              <TruncatedText text={title || (channelName && '@' + channelName)} lines={2} showTooltip />
              {odyseeMembership && <MembershipBadge membershipName={odyseeMembership} />}
            </h1>
            <div className="channel__meta">
              <Tooltip title={formattedSubCount} followCursor placement="top">
                <span>
                  {getChannelSubCountStr(subCount, compactSubCount)}
                  {Number.isInteger(subCount) ? (
                    <HelpLink href="https://odysee.com/@OdyseeHelp:b/OdyseeBasics:c" />
                  ) : (
                    '\u00A0'
                  )}
                </span>
              </Tooltip>
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
          <div className="channel-cover__gradient" />
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
            <TabList className="tabs__list--channel-page">
              <Tab disabled={editing}>{__('Content')}</Tab>
              <Tab disabled={editing}>{__('Playlists')}</Tab>
              <Tab disabled={editing}>{__('Channels')}</Tab>
              <Tab className="tab--membership" disabled={editing || isOdyseeChannel}>
                {__('Membership')}
              </Tab>
              <Tab disabled={editing}>{__('Community')}</Tab>
              <Tab>{editing ? __('Editing Your Channel') : __('About --[tab title in Channel Page]--')}</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                {currentView === CHANNEL_PAGE.VIEWS.CONTENT && (
                  <ChannelContent
                    uri={uri}
                    channelIsBlackListed={channelIsBlackListed}
                    viewHiddenChannels
                    claimType={['stream', 'repost']}
                    empty={<section className="main--empty">{__('No Content Found')}</section>}
                  />
                )}
              </TabPanel>
              <TabPanel>
                {currentView === CHANNEL_PAGE.VIEWS.LISTS && (
                  <ChannelContent
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
                {currentView === CHANNEL_PAGE.VIEWS.MEMBERSHIP && !isOdyseeChannel && (
                  <MembershipChannelTab uri={uri} />
                )}
              </TabPanel>
              <TabPanel>
                {(showDiscussion || currentView === CHANNEL_PAGE.VIEWS.DISCUSSION) && <ChannelDiscussion uri={uri} />}
              </TabPanel>
              <TabPanel>{currentView === CHANNEL_PAGE.VIEWS.ABOUT && <ChannelAbout uri={uri} />}</TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </ChannelPageContext.Provider>
    </Page>
  );
}

export default ChannelPage;
