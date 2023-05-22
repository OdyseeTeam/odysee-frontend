// @flow
import { SIMPLE_SITE } from 'config';
import { SECTION_TAGS } from 'constants/collections';
import * as CS from 'constants/claim_search';
import * as ICONS from 'constants/icons';
import React, { Fragment } from 'react';
import GeoRestrictionInfo from 'component/geoRestictionInfo';
import { useHistory } from 'react-router-dom';
import Button from 'component/button';
import ClaimListDiscover from 'component/claimListDiscover';
import Icon from 'component/common/icon';
import LivestreamLink from 'component/livestreamLink';
import { Form, FormField } from 'component/common/form';
import ScheduledStreams from 'component/scheduledStreams';
import { ClaimSearchFilterContext } from 'contexts/claimSearchFilterContext';
import { SearchResults } from './internal/searchResults';
import { useIsLargeScreen } from 'effects/use-screensize';
import usePersistedState from 'effects/use-persisted-state';
import Ad from 'web/component/ad';
import { tagSearchCsOptionsHook } from 'util/search';
import { lazyImport } from 'util/lazyImport';

const HiddenNsfwClaims = lazyImport(() =>
  import('component/hiddenNsfwClaims' /* webpackChunkName: "hiddenNsfwClaims" */)
);

const TYPES_TO_ALLOW_FILTER = ['stream', 'repost'];

type Props = {
  uri: string,
  totalPages: number,
  fetching: boolean,
  params: { page: number },
  pageOfClaimsInChannel: Array<StreamClaim>,
  channelIsBlocked: boolean,
  channelIsMine: boolean,
  filters: any,
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
  activeLivestreamForChannel: ?LivestreamActiveClaim,
  hasPremiumPlus: boolean,
};

function ContentTab(props: Props) {
  const {
    uri,
    fetching,
    channelIsMine,
    channelIsBlocked,
    channelIsBlackListed,
    filters,
    claim,
    defaultPageSize = CS.PAGE_SIZE,
    defaultInfiniteScroll = true,
    showMature,
    tileLayout,
    viewHiddenChannels,
    doResolveUris,
    claimType,
    empty,
    activeLivestreamForChannel,
    hasPremiumPlus,
  } = props;

  const claimsInChannel = 9999;
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [orderBy, setOrderBy] = React.useState(undefined);

  const {
    location: { search },
  } = useHistory();

  // In Channel Page, ignore the global settings for these 2:
  const [hideReposts, setHideReposts] = usePersistedState('hideRepostsChannelPage', false);
  const [hideMembersOnly, setHideMembersOnly] = usePersistedState('channelPage-hideMembersOnly', false);

  const claimSearchFilterCtx = {
    contentTypes: CS.CONTENT_TYPES,
    repost: { hideReposts, setHideReposts },
    membersOnly: { hideMembersOnly, setHideMembersOnly },
  };

  const claimId = claim && claim.claim_id;
  const showFilters =
    !claimType ||
    (Array.isArray(claimType)
      ? claimType.every((ct) => TYPES_TO_ALLOW_FILTER.includes(ct))
      : TYPES_TO_ALLOW_FILTER.includes(claimType));
  const isLargeScreen = useIsLargeScreen();
  const dynamicPageSize = isLargeScreen ? Math.ceil(defaultPageSize * 3) : defaultPageSize;

  const showScheduledLiveStreams = claimType !== 'collection'; // i.e. not on the playlist page.
  const scheduledChanIds = React.useMemo(() => [claimId], [claimId]);

  function handleInputChange(e) {
    const { value } = e.target;

    setSearchQuery(value);
  }

  React.useEffect(() => {
    const urlParams = new URLSearchParams(search).get('order');
    setOrderBy(urlParams);
  }, [search]);

  React.useEffect(() => {
    setSearchQuery('');
  }, [claimId]);

  return (
    <Fragment>
      <GeoRestrictionInfo uri={uri} />

      {!fetching && Boolean(claimsInChannel) && !channelIsBlocked && !channelIsBlackListed && (
        <React.Suspense fallback={null}>
          <HiddenNsfwClaims uri={uri} />
        </React.Suspense>
      )}

      <LivestreamLink uri={uri} />

      {!fetching && showScheduledLiveStreams && (
        <ScheduledStreams
          name="contentTab"
          channelIds={scheduledChanIds}
          tileLayout={false}
          liveUris={
            activeLivestreamForChannel && activeLivestreamForChannel.uri ? [activeLivestreamForChannel.uri] : []
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
            <Button button="link" href="https://help.odysee.tv/copyright/" label={__('Read More')} />
          </div>
        </section>
      )}

      {!fetching && channelIsBlocked && (
        <div className="card--section">
          <h2 className="help">{__('You have blocked this channel content.')}</h2>
        </div>
      )}

      {!channelIsMine && claimsInChannel > 0 && (
        <React.Suspense fallback={null}>
          <HiddenNsfwClaims uri={uri} />
        </React.Suspense>
      )}
      {!fetching && (
        <ClaimSearchFilterContext.Provider value={claimSearchFilterCtx}>
          <ClaimListDiscover
            ignoreSearchInLanguage
            hasSource
            defaultFreshness={CS.FRESH_ALL}
            showHiddenByUser={viewHiddenChannels}
            hideRepostsOverride={hideReposts}
            hideMembersOnly={hideMembersOnly}
            fetchViewCount
            hideFilters={!showFilters}
            hideAdvancedFilter={!showFilters}
            tileLayout={tileLayout}
            uris={isSearching ? [] : null}
            streamType={SIMPLE_SITE ? CS.CONTENT_ALL : undefined}
            channelIds={!searchQuery && [claimId]}
            claimType={claimType}
            feeAmount={undefined}
            defaultOrderBy={filters ? filters.order_by : CS.ORDER_BY_NEW}
            pageSize={dynamicPageSize}
            infiniteScroll={defaultInfiniteScroll}
            injectedItem={
              !hasPremiumPlus && {
                node: (index, lastVisibleIndex, pageSize) => {
                  if (pageSize && index < pageSize) {
                    return index === lastVisibleIndex ? <Ad type="tileA" tileLayout={tileLayout} /> : null;
                  } else {
                    return index % (pageSize * 2) === 0 ? <Ad type="tileA" tileLayout={tileLayout} /> : null;
                  }
                },
              }
            }
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
                  {searchQuery && (
                    <Button
                      icon={ICONS.REMOVE}
                      aria-label={__('Clear')}
                      button="alt"
                      className="wunderbar__clear"
                      onClick={() => setSearchQuery('')}
                    />
                  )}
                </Form>
              )
            }
            subSection={
              <SearchResults
                searchQuery={searchQuery}
                claimId={claimId}
                showMature={showMature}
                tileLayout={tileLayout}
                orderBy={orderBy}
                onResults={(results) => setIsSearching(results !== null)}
                doResolveUris={doResolveUris}
              />
            }
            isChannel
            channelIsMine={channelIsMine}
            empty={isSearching ? ' ' : empty}
            notTags={claimType === 'collection' ? [SECTION_TAGS.FEATURED_CHANNELS] : undefined}
            csOptionsHook={tagSearchCsOptionsHook}
            contentType={filters && filters.file_type}
          />
        </ClaimSearchFilterContext.Provider>
      )}
    </Fragment>
  );
}

export default ContentTab;
