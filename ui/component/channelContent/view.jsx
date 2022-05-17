// @flow
import { SIMPLE_SITE } from 'config';
import * as CS from 'constants/claim_search';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import React, { Fragment } from 'react';
import HiddenNsfwClaims from 'component/hiddenNsfwClaims';
import { useHistory } from 'react-router-dom';
import Button from 'component/button';
import ClaimListDiscover from 'component/claimListDiscover';
import Ads from 'web/component/ads';
import Icon from 'component/common/icon';
import LivestreamLink from 'component/livestreamLink';
import { Form, FormField } from 'component/common/form';
import ScheduledStreams from 'component/scheduledStreams';
import { SearchResults } from './internal/searchResults';
import useFetchLiveStatus from 'effects/use-fetch-live';
import { useIsLargeScreen } from 'effects/use-screensize';

const TYPES_TO_ALLOW_FILTER = ['stream', 'repost'];

type Props = {
  uri: string,
  totalPages: number,
  fetching: boolean,
  params: { page: number },
  pageOfClaimsInChannel: Array<StreamClaim>,
  channelIsBlocked: boolean,
  channelIsMine: boolean,
  fetchClaims: (string, number) => void,
  channelIsBlackListed: boolean,
  defaultPageSize?: number,
  defaultInfiniteScroll?: Boolean,
  claim: Claim,
  isAuthenticated: boolean,
  showMature: boolean,
  tileLayout: boolean,
  viewHiddenChannels: boolean,
  doResolveUris: (Array<string>, boolean) => void,
  claimType: string,
  empty?: string,
  doFetchChannelLiveStatus: (string) => void,
  activeLivestreamForChannel: any,
  activeLivestreamInitialized: boolean,
  adBlockerFound: ?boolean,
  hasPremiumPlus: ?boolean,
};

function ChannelContent(props: Props) {
  const {
    uri,
    fetching,
    channelIsMine,
    channelIsBlocked,
    channelIsBlackListed,
    claim,
    defaultPageSize = CS.PAGE_SIZE,
    defaultInfiniteScroll = true,
    showMature,
    tileLayout,
    viewHiddenChannels,
    doResolveUris,
    claimType,
    empty,
    doFetchChannelLiveStatus,
    activeLivestreamForChannel,
    activeLivestreamInitialized,
    adBlockerFound,
    hasPremiumPlus,
  } = props;
  // const claimsInChannel = (claim && claim.meta.claims_in_channel) || 0;

  const claimsInChannel = 9999;
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const {
    location: { pathname, search },
  } = useHistory();
  const url = `${pathname}${search}`;
  const claimId = claim && claim.claim_id;
  const isChannelEmpty = !claim || !claim.meta;
  const showFilters =
    !claimType ||
    (Array.isArray(claimType)
      ? claimType.every((ct) => TYPES_TO_ALLOW_FILTER.includes(ct))
      : TYPES_TO_ALLOW_FILTER.includes(claimType));
  const isLargeScreen = useIsLargeScreen();
  const dynamicPageSize = isLargeScreen ? Math.ceil(defaultPageSize * 3) : defaultPageSize;

  function handleInputChange(e) {
    const { value } = e.target;
    setSearchQuery(value);
  }

  React.useEffect(() => {
    setSearchQuery('');
  }, [url]);

  const isInitialized = Boolean(activeLivestreamForChannel) || activeLivestreamInitialized;
  const isChannelBroadcasting = Boolean(activeLivestreamForChannel);

  useFetchLiveStatus(claimId, doFetchChannelLiveStatus);

  const showScheduledLiveStreams = claimType !== 'collection'; // ie. not on the playlist page.

  const PremiumPlus = () => {
    return (
      <li className="card claim-preview--tile claim-preview--premium-plus">
        <a href={`/$/${PAGES.ODYSEE_MEMBERSHIP}`}>
          <div className="media__thumb" />
          <div className="claim-tile__header">
            <h2 className="claim-tile__title">{__('No ads and access to exclusive features!')}</h2>
          </div>
          <div>
            <div className="claim-tile__info">
              <Icon icon={ICONS.UPGRADE} />
              <div className="claim-tile__about">
                <div className="channel-name">{__('Get Odysee Premium+')}</div>
                <div className="claim-tile__about--counts">
                  <span className="date_time">{__('Now')}</span>
                </div>
              </div>
            </div>
          </div>
        </a>
      </li>
    );
  };

  return (
    <Fragment>
      {!fetching && Boolean(claimsInChannel) && !channelIsBlocked && !channelIsBlackListed && (
        <HiddenNsfwClaims uri={uri} />
      )}

      {!fetching && isInitialized && isChannelBroadcasting && !isChannelEmpty && (
        <LivestreamLink claimUri={activeLivestreamForChannel.claimUri} />
      )}

      {!fetching && showScheduledLiveStreams && (
        <ScheduledStreams
          channelIds={[claimId]}
          tileLayout={tileLayout}
          liveUris={
            isChannelBroadcasting && activeLivestreamForChannel.claimUri ? [activeLivestreamForChannel.claimUri] : []
          }
          showHideSetting={false}
        />
      )}

      {!fetching && channelIsBlackListed && (
        <section className="card card--section">
          <p>
            {__(
              'In response to a complaint we received under the US Digital Millennium Copyright Act, we have blocked access to this channel from our applications. Content may also be blocked due to DMCA Red Flag rules which are obvious copyright violations we come across, are discussed in public channels, or reported to us.'
            )}
          </p>
          <div className="section__actions">
            <Button button="link" href="https://odysee.com/@OdyseeHelp:b/copyright:f" label={__('Read More')} />
          </div>
        </section>
      )}

      {!fetching && channelIsBlocked && (
        <div className="card--section">
          <h2 className="help">{__('You have blocked this channel content.')}</h2>
        </div>
      )}

      {!channelIsMine && claimsInChannel > 0 && <HiddenNsfwClaims uri={uri} />}

      {!fetching && (
        <ClaimListDiscover
          ignoreSearchInLanguage
          hasSource
          defaultFreshness={CS.FRESH_ALL}
          showHiddenByUser={viewHiddenChannels}
          forceShowReposts
          fetchViewCount
          hideFilters={!showFilters}
          hideAdvancedFilter={!showFilters}
          tileLayout={tileLayout}
          uris={isSearching ? [] : null}
          streamType={SIMPLE_SITE ? CS.CONTENT_ALL : undefined}
          channelIds={[claimId]}
          claimType={claimType}
          feeAmount={CS.FEE_AMOUNT_ANY}
          defaultOrderBy={CS.ORDER_BY_NEW}
          pageSize={dynamicPageSize}
          infiniteScroll={defaultInfiniteScroll}
          injectedItem={{
            // node: <Ads type="video" tileLayout={tileLayout} small />
            node: adBlockerFound && !hasPremiumPlus ? <PremiumPlus /> : <Ads small type="video" tileLayout />,
          }}
          meta={
            showFilters && (
              <Form onSubmit={() => {}} className="wunderbar--inline">
                <Icon icon={ICONS.SEARCH} />
                <FormField
                  name="channel_search"
                  className="wunderbar__input--inline"
                  value={searchQuery}
                  onChange={handleInputChange}
                  type="text"
                  placeholder={__('Search')}
                />
              </Form>
            )
          }
          subSection={
            <SearchResults
              searchQuery={searchQuery}
              claimId={claimId}
              showMature={showMature}
              tileLayout={tileLayout}
              onResults={(results) => setIsSearching(results !== null)}
              doResolveUris={doResolveUris}
            />
          }
          isChannel
          channelIsMine={channelIsMine}
          empty={isSearching ? ' ' : empty}
        />
      )}
    </Fragment>
  );
}

export default ChannelContent;
