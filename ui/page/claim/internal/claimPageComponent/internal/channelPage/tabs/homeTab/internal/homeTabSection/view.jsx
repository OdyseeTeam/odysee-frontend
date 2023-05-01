// @flow
import React from 'react';
import ClaimListDiscover from 'component/claimListDiscover';
import FeaturedSection from '../featuredSection';
import { useWindowSize } from 'effects/use-screensize';
import { DEBOUNCE_WAIT_DURATION_MS, SEARCH_PAGE_SIZE } from 'constants/search';
import ChannelSection from 'component/channelSections/Section';
import ScheduledStreams from 'component/scheduledStreams';
import ClaimPreviewTile from 'component/claimPreviewTile';
import Ad from 'web/component/ad/ad';
import { lighthouse } from 'redux/actions/search';
import * as CS from 'constants/claim_search';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';

type Props = {
  channelClaimId: any,
  index: number,
  topContentGridIndex: number,
  section: any,
  editMode: boolean,
  hasFeaturedContent: boolean,
  handleEditCollection: (any) => void,
  handleViewMore: (any) => void,
  // --- select ---
  claimSearchResults: Array<string>,
  collectionUrls: Array<string>,
  collectionClaimIds: ?Array<string>,
  collectionName: string,
  optionsStringified: string,
  requiresSearch: boolean,
  fetchingClaimSearch: boolean,
  publishedCollections: CollectionGroup,
  singleClaimUri: string,
  featuredChannels: any,
  hasPremiumPlus: boolean,
  // --- perform ---
  doClaimSearch: (ClaimSearchOptions, ?DoClaimSearchSettings) => void,
  doResolveClaimId: (claimId: string) => void,
  doResolveUris: (Array<string>) => Promise<any>,
};

function HomeTabSection(props: Props) {
  const {
    channelClaimId,
    index,
    topContentGridIndex,
    section,
    editMode,
    hasFeaturedContent,
    handleEditCollection,
    handleViewMore,
    claimSearchResults,
    collectionUrls,
    collectionClaimIds,
    collectionName,
    optionsStringified,
    requiresSearch,
    fetchingClaimSearch,
    publishedCollections,
    singleClaimUri,
    hasPremiumPlus,
    featuredChannels,
    doClaimSearch,
    doResolveClaimId,
    doResolveUris,
  } = props;

  const timedOut = claimSearchResults === null;
  const shouldPerformSearch =
    !singleClaimUri && !fetchingClaimSearch && !timedOut && !claimSearchResults && !collectionUrls && section;
  const shouldResolveCollectionClaims = Boolean(!collectionClaimIds && collectionUrls);
  const publishedList = (Object.keys(publishedCollections || {}): any);
  const maxClaimsInSection = 12;

  const windowSize = useWindowSize();
  const maxTilesPerRow = windowSize >= 1600 ? 6 : windowSize > 1150 ? 4 : windowSize > 900 ? 3 : 2;
  const featuredChannel = featuredChannels && featuredChannels.find((list) => list.id === section.claim_id);
  const hasFeaturedClaim = singleClaimUri || (claimSearchResults && claimSearchResults[0]) || section.claim_id;

  React.useEffect(() => {
    if (shouldPerformSearch) {
      const searchOptions = JSON.parse(optionsStringified);
      const searchSettings = { fetch: { viewCount: true } };
      doClaimSearch(searchOptions, searchSettings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- DOESN'T FEEL RIGHT WITHOUT optionsStringified
  }, [doClaimSearch, shouldPerformSearch]);

  React.useEffect(() => {
    if (section.claim_id) {
      doResolveClaimId(section.claim_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [section]);

  React.useEffect(() => {
    if (shouldResolveCollectionClaims) {
      doResolveUris(collectionUrls);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [shouldResolveCollectionClaims]);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState(undefined);

  function handleInputChange(e) {
    const { value } = e.target;
    setSearchQuery(value);
  }

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length < 3 || !channelClaimId) {
        return setSearchResults(null);
      }

      setIsSearching(true);

      lighthouse
        .search(
          `&s=${encodeURIComponent(searchQuery)}` +
            `&channel_id=${encodeURIComponent(channelClaimId)}` +
            `&nsfw=${'false'}` +
            `&resolve=${'true'}` +
            `&size=${SEARCH_PAGE_SIZE}`
        )
        .then(({ body: results }) => {
          setSearchResults(results);
        })
        .catch(() => {
          setSearchResults(null);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, DEBOUNCE_WAIT_DURATION_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION (definitely needs channelClaimId, no?)
  }, [searchQuery]);

  function getTitle() {
    switch (section.type) {
      case 'featured':
        return null;
      case 'content':
        switch (section.file_type.length === 1 && section.file_type[0]) {
          case CS.FILE_VIDEO:
            switch (section.order_by ? section.order_by[0] : 'release_time') {
              case 'release_time':
                return __('New Videos');
              case 'trending_group':
                return __('Trending Videos');
              case 'effective_amount':
                return __('Top Videos');
            }
            break;
          case CS.FILE_AUDIO:
            switch (section.order_by ? section.order_by[0] : 'release_time') {
              case 'release_time':
                return __('New Audio');
              case 'trending_group':
                return __('Trending Audio');
              case 'effective_amount':
                return __('Top Audio');
            }
            break;
          case CS.FILE_IMAGE:
            switch (section.order_by ? section.order_by[0] : 'release_time') {
              case 'release_time':
                return __('New Images');
              case 'trending_group':
                return __('Trending Images');
              case 'effective_amount':
                return __('Top Images');
            }
            break;
          case CS.FILE_DOCUMENT:
            switch (section.order_by ? section.order_by[0] : 'release_time') {
              case 'release_time':
                return __('New Posts');
              case 'trending_group':
                return __('Trending Posts');
              case 'effective_amount':
                return __('Top Posts');
            }
            break;
          default:
            switch (section.order_by ? section.order_by[0] : 'release_time') {
              case 'release_time':
                return __('New Content');
              case 'trending_group':
                return __('Trending Content');
              case 'effective_amount':
                return __('Top Content');
            }
        }
        break;
      case 'playlists':
        return __('Playlists');
      case 'channels':
        return (
          featuredChannels &&
          featuredChannels.find((list) => list.id === section.claim_id) &&
          featuredChannels.find((list) => list.id === section.claim_id).value.title
        );
    }
  }

  const isLoading =
    (fetchingClaimSearch || !requiresSearch) &&
    section.type &&
    section.type !== 'featured' &&
    !claimSearchResults &&
    !collectionClaimIds &&
    !featuredChannels;

  return (
    <div className="home-section-content">
      {index === 0 && <ScheduledStreams channelIds={[channelClaimId]} tileLayout={false} showHideSetting={false} />}
      {editMode && (
        <div className="home-section-header-wrapper">
          <div className="home-section-header-option">
            <label>{__('Type')}</label>
            <select
              name="type"
              value={section.type || 'select'}
              onChange={(e) => handleEditCollection({ change: { field: e.target.name, value: e.target.value } })}
            >
              <option value="select" disabled="disabled">
                {__('Select')}
              </option>
              <option value="featured" disabled={hasFeaturedContent}>
                {__('Featured')}
              </option>
              <option value="content">{__('Content')}</option>
              <option value="playlists">{__('Playlists')}</option>
              <option value="playlist">{__('Playlist')}</option>
              <option value="channels" disabled={!featuredChannels}>
                {__('Channels')}
              </option>
              {/* <option value="reposts">{__('Reposts')}</option> */}
            </select>
          </div>
          {section.type === 'content' && (
            <div className="home-section-header-option">
              <label>{__('File Type')}</label>
              <select
                name="file_type"
                value={section.file_type || CS.FILE_TYPES}
                onChange={(e) => handleEditCollection({ change: { field: e.target.name, value: e.target.value } })}
              >
                <option value={CS.FILE_TYPES}>{__('Show All')}</option>
                <option value={CS.FILE_VIDEO}>{__('Videos')}</option>
                <option value={CS.FILE_AUDIO}>{__('Audio')}</option>
                <option value={CS.FILE_DOCUMENT}>{__('Posts')}</option>
                <option value={CS.FILE_IMAGE}>{__('Images')}</option>
              </select>
            </div>
          )}
          {section.type === 'playlist' && (
            <div className="home-section-header-option">
              <label>{__('Playlist')}</label>
              <select
                name="claim_id"
                value={section.claim_id || 'select'}
                onChange={(e) => handleEditCollection({ change: { field: e.target.name, value: e.target.value } })}
              >
                <option value="select">{__('Select a Playlist')}</option>
                {publishedList &&
                  publishedList.map((list, i) => {
                    return (
                      <option key={i} value={list}>
                        {publishedCollections[list].name}
                      </option>
                    );
                  })}
              </select>
            </div>
          )}
          {section.type === 'channels' && (
            <div className="home-section-header-option">
              <label>{__('Featured Channels')}</label>
              <select
                name="claim_id"
                value={section.claim_id || 'select'}
                onChange={(e) => handleEditCollection({ change: { field: e.target.name, value: e.target.value } })}
              >
                <option value="select">{__('Select a Collection')}</option>
                {featuredChannels &&
                  featuredChannels.map((list, i) => {
                    return (
                      <option key={i} value={list.id}>
                        {list.value.title}
                      </option>
                    );
                  })}
              </select>
            </div>
          )}
          {(section.type === 'content' || section.type === 'playlists') && (
            <div className="home-section-header-option">
              <label>{__('Order By')}</label>
              <select
                name="order_by"
                value={(section.order_by && section.order_by[0]) || 'release_time'}
                onChange={(e) => handleEditCollection({ change: { field: e.target.name, value: e.target.value } })}
              >
                <option value="release_time">{__('New')}</option>
                <option value="trending_group">{__('Trending')}</option>
                <option value="effective_amount">{__('Top')}</option>
              </select>
            </div>
          )}
          {section.type === 'featured' && (
            <>
              <div className="home-section-header-option">
                <label>{__('Search')}</label>
                <input
                  id="featured"
                  name="search"
                  value={searchQuery}
                  onChange={handleInputChange}
                  placeholder={__('Search')}
                />
              </div>
              <div className="home-section-header-option">
                <label>{__('Results')}</label>
                <select
                  name="claim_id"
                  value={section.claim_id || 'select'}
                  disabled={!searchResults}
                  onChange={(e) => handleEditCollection({ change: { field: e.target.name, value: e.target.value } })}
                >
                  <option value="select">{__('Select...')}</option>
                  {!isSearching && searchResults ? (
                    searchResults.map((result, i) => {
                      return (
                        <option key={i} value={result.claimId}>
                          {result.title}
                        </option>
                      );
                    })
                  ) : (
                    <option value="no_results">{__('No Results...')}</option>
                  )}
                </select>
              </div>
            </>
          )}
        </div>
      )}
      {isLoading && (
        <div className="home-section-content">
          <div className="section">
            <label className="home-section-title">{__('Loading...')}</label>
            <section className="claim-grid">
              {new Array(12).fill(0).map((x, i) => (
                <ClaimPreviewTile key={i} placeholder="loading" pulse />
              ))}
            </section>
          </div>
        </div>
      )}
      {section.type &&
        (section.claim_id ||
          collectionUrls ||
          (claimSearchResults && claimSearchResults.length > 0) ||
          (section.type === 'featured' && hasFeaturedClaim)) && (
          <div className="section">
            {section.type !== 'featured' ? (
              <>
                <label className="home-section-title">{collectionName || getTitle() || __('Loading...')}</label>
                <label className="show-more" onClick={() => handleViewMore(section)}>
                  {__('View More')}
                  <Icon icon={ICONS.ARROW_RIGHT} />
                </label>
                {section.type !== 'channels' ? (
                  <ClaimListDiscover
                    hideFilters
                    hideAdvancedFilter
                    hideLayoutButton
                    tileLayout
                    infiniteScroll={false}
                    useSkeletonScreen={false}
                    uris={collectionUrls || claimSearchResults}
                    maxClaimRender={maxClaimsInSection}
                    claimIds={collectionClaimIds}
                    injectedItem={
                      !hasPremiumPlus &&
                      index === topContentGridIndex && {
                        node: (index) => {
                          return index === maxTilesPerRow ? <Ad type="tileA" tileLayout /> : null;
                        },
                      }
                    }
                  />
                ) : (
                  featuredChannel && (
                    <ChannelSection
                      key={'a'}
                      uris={featuredChannel && featuredChannel.value.uris}
                      channelId={channelClaimId}
                    />
                  )
                )}
              </>
            ) : (
              <FeaturedSection
                uri={singleClaimUri || (claimSearchResults && claimSearchResults[0])}
                claimId={section.claim_id}
              />
            )}
          </div>
        )}
    </div>
  );
}

export default HomeTabSection;
