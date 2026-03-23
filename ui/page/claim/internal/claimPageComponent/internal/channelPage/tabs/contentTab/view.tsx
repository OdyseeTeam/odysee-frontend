import { SIMPLE_SITE } from 'config';
import { SECTION_TAGS } from 'constants/collections';
import * as CS from 'constants/claim_search';
import * as ICONS from 'constants/icons';
import * as SETTINGS from 'constants/settings';
import React, { Fragment } from 'react';
import GeoRestrictionInfo from 'component/geoRestictionInfo';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from 'component/button';
import ClaimListDiscover from 'component/claimListDiscover';
import Icon from 'component/common/icon';
import LivestreamLink from 'component/livestreamLink';
import { Form, FormField } from 'component/common/form';
import UpcomingClaims from 'component/upcomingClaims';
import { ClaimSearchFilterContext } from 'contexts/claimSearchFilterContext';
import { SearchResults } from './internal/searchResults';
import { useIsLargeScreen } from 'effects/use-screensize';
import usePersistedState from 'effects/use-persisted-state';
import { tagSearchCsOptionsHook } from 'util/search';
import { lazyImport } from 'util/lazyImport';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { PAGE_SIZE } from 'constants/claim';
import {
  makeSelectClaimsInChannelForPage,
  makeSelectFetchingChannelClaims,
  selectClaimIsMine,
  makeSelectTotalPagesInChannelSearch,
  selectClaimForUri,
} from 'redux/selectors/claims';
import { doResolveUris as doResolveUrisAction } from 'redux/actions/claims';
import { makeSelectChannelIsMuted } from 'redux/selectors/blocked';
import { selectClientSetting, selectShowMatureContent } from 'redux/selectors/settings';
import { selectAdBlockerFound } from 'redux/selectors/app';
import { selectActiveLivestreamForChannel } from 'redux/selectors/livestream';
import { getChannelIdFromClaim } from 'util/claim';
const HiddenNsfwClaims = lazyImport(
  () =>
    import(
      'component/hiddenNsfwClaims'
      /* webpackChunkName: "hiddenNsfwClaims" */
    )
);
const TYPES_TO_ALLOW_FILTER = ['stream', 'repost'];
type Props = {
  uri: string;
  filters: any;
  channelIsBlackListed: boolean;
  defaultPageSize?: number;
  defaultInfiniteScroll?: boolean;
  viewHiddenChannels: boolean;
  claimType: string;
  empty?: string;
  shortsOnly?: boolean;
  excludeShorts?: boolean;
  loadedCallback?: (arg0: number) => void;
};

function ContentTab(props: Props) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const {
    uri,
    filters,
    channelIsBlackListed,
    defaultPageSize,
    viewHiddenChannels,
    claimType,
    empty,
    shortsOnly: shortsOnlyProp,
    excludeShorts,
    loadedCallback,
    defaultInfiniteScroll,
  } = props;
  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => (uri ? selectClaimForUri(state, uri) : undefined));
  const channelClaimId = getChannelIdFromClaim(claim);
  const fetching = useAppSelector((state) => makeSelectFetchingChannelClaims(uri)(state));
  const channelIsMine = useAppSelector((state) => selectClaimIsMine(state, claim));
  const channelIsBlocked = useAppSelector((state) => makeSelectChannelIsMuted(uri)(state));
  const showMature = useAppSelector(selectShowMatureContent);
  const tileLayout = useAppSelector((state) => selectClientSetting(state, SETTINGS.TILE_LAYOUT));
  const hideShorts = useAppSelector((state) => selectClientSetting(state, SETTINGS.HIDE_SHORTS));
  const activeLivestreamForChannel = useAppSelector((state) => selectActiveLivestreamForChannel(state, channelClaimId));
  const doResolveUris = (uris: Array<string>, doReplay?: boolean) => dispatch(doResolveUrisAction(uris, doReplay));
  const urlParams = new URLSearchParams(search);
  const shortsOnly = shortsOnlyProp || urlParams.get('view') === 'shorts';
  const claimsInChannel = 9999;
  const [searchQuery, setSearchQuery] = React.useState(urlParams.get('search') || '');
  const [isSearching, setIsSearching] = React.useState(false);
  const orderBy = urlParams.get('order');
  const contentType = urlParams.get(CS.CONTENT_KEY);
  const freshness = urlParams.get(CS.FRESH_KEY);
  const sortByParam = urlParams.get(CS.SORT_BY_KEY);
  const durationParam = urlParams.get(CS.DURATION_KEY);
  const [minDurationMinutes] = usePersistedState(`minDurUserMinutes-${pathname}`, null);
  const [maxDurationMinutes] = usePersistedState(`maxDurUserMinutes-${pathname}`, null);
  // In Channel Page, ignore the global settings for these 2:
  const [hideReposts, setHideReposts] = usePersistedState('hideRepostsChannelPage', false);
  const [hideMembersOnly, setHideMembersOnly] = usePersistedState('channelPage-hideMembersOnly', false);
  const isChannelSearch = searchQuery.trim().length > 2;
  const claimSearchFilterCtx = {
    contentTypes: CS.CONTENT_TYPES,
    repost: {
      hideReposts,
      setHideReposts,
    },
    membersOnly: {
      hideMembersOnly,
      setHideMembersOnly,
    },
    isChannelSearch,
  };
  const claimId = claim && claim.claim_id;
  const showFilters =
    !claimType ||
    (Array.isArray(claimType)
      ? claimType.every((ct) => TYPES_TO_ALLOW_FILTER.includes(ct))
      : TYPES_TO_ALLOW_FILTER.includes(claimType));
  const isLargeScreen = useIsLargeScreen();
  const dynamicPageSize = isLargeScreen ? Math.ceil(defaultPageSize * 3) : defaultPageSize;
  const showScheduledLiveStreams = claimType !== 'collection' && !shortsOnly; // i.e. not on the playlist page.

  const scheduledChanIds = React.useMemo(() => [claimId], [claimId]);

  function handleInputChange(e) {
    const { value } = e.target;
    const newUrlParams = new URLSearchParams(search);
    newUrlParams.set('search', value);
    navigate(`${pathname}?${newUrlParams.toString()}`);
    setSearchQuery(value);
  }

  /* Not sure what this was for (leaving commented out instead of deleting for now)
    React.useEffect(() => {
      setSearchQuery('');
    }, [claimId]);
  */
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
        <UpcomingClaims
          name="contentTab"
          channelIds={scheduledChanIds}
          tileLayout={false}
          liveUris={
            activeLivestreamForChannel && activeLivestreamForChannel.uri ? [activeLivestreamForChannel.uri] : []
          }
          showHideSetting={false}
          isChannelPage
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
            uris={searchQuery.length > 2 || isSearching ? [] : null}
            streamType={SIMPLE_SITE ? CS.CONTENT_ALL : undefined}
            channelIds={searchQuery.length < 3 && [claimId]}
            claimType={claimType}
            feeAmount={undefined}
            defaultOrderBy={filters ? filters.order_by : CS.ORDER_BY_NEW}
            pageSize={dynamicPageSize}
            infiniteScroll={defaultInfiniteScroll}
            isShortFromChannelPage={shortsOnly}
            excludeShortsAspectRatio={excludeShorts}
            {...(shortsOnly
              ? {
                  duration: `<=${SETTINGS.SHORTS_DURATION_LTE}`,
                  contentType: CS.FILE_VIDEO,
                  contentAspectRatio: `<=${SETTINGS.SHORTS_ASPECT_RATIO_LTE}`,
                  sectionTitle: 'Shorts',
                }
              : {})}
            loadedCallback={shortsOnly && searchQuery.length > 0 ? undefined : loadedCallback}
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
                hideShorts={hideShorts}
                contentType={contentType}
                freshness={freshness}
                sortByParam={sortByParam}
                durationParam={durationParam}
                customMinMinutes={minDurationMinutes}
                customMaxMinutes={maxDurationMinutes}
                onResults={(results) => setIsSearching(results !== null)}
                doResolveUris={doResolveUris}
                {...(shortsOnly
                  ? {
                      maxDuration: SETTINGS.SHORTS_DURATION_LTE,
                      maxAspectRatio: SETTINGS.SHORTS_ASPECT_RATIO_LTE,
                    }
                  : {})}
              />
            }
            isChannel
            channelIsMine={channelIsMine}
            empty={isSearching || searchQuery.length > 2 ? ' ' : empty}
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
