// @flow
import React from 'react';
import ClaimList from 'component/claimList';
import FeaturedSection from '../featuredSection';
import { useWindowSize } from 'effects/use-screensize';
import { DEBOUNCE_WAIT_DURATION_MS, SEARCH_PAGE_SIZE } from 'constants/search';
import { lighthouse } from 'redux/actions/search';
import * as CS from 'constants/claim_search';

type Props = {
  channelClaimId: any,
  section: any,
  editMode: boolean,
  hasFeaturedContent: boolean,
  handleEditCollection: (any) => void,
  // --- select ---
  claimSearchResults: Array<string>,
  collectionUrls: ?Array<string>,
  collectionName: string,
  optionsStringified: string,
  fetchingClaimSearch: boolean,
  publishedCollections: CollectionGroup,
  singleClaimUri: string,
  // --- perform ---
  doClaimSearch: ({}) => void,
};

function HomeTabSection(props: Props) {
  const {
    channelClaimId,
    section,
    editMode,
    hasFeaturedContent,
    handleEditCollection,
    claimSearchResults,
    collectionUrls,
    collectionName,
    optionsStringified,
    fetchingClaimSearch,
    publishedCollections,
    singleClaimUri,
    doClaimSearch,
  } = props;

  const timedOut = claimSearchResults === null;
  const shouldPerformSearch =
    !singleClaimUri &&
    !fetchingClaimSearch &&
    !timedOut &&
    !claimSearchResults &&
    !collectionUrls &&
    section &&
    section.type !== 'playlist' &&
    section.type !== 'featured';
  const publishedList = (Object.keys(publishedCollections || {}): any);

  const windowSize = useWindowSize();
  const maxTilesPerRow = windowSize >= 1600 ? 6 : windowSize > 1150 ? 4 : windowSize > 900 ? 3 : 2;

  React.useEffect(() => {
    if (shouldPerformSearch) {
      const searchOptions = JSON.parse(optionsStringified);
      doClaimSearch(searchOptions);
    }
  }, [doClaimSearch, shouldPerformSearch]);

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
    }
  }

  return (
    <div className="home-section-content">
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
              {/* <option value="channels">{__('Channels')}</option> */}
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
                value={section.claimId || 'select'}
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
      {section.type && (section.claim_id || collectionUrls || (claimSearchResults && claimSearchResults.length > 0)) && (
        <div className="section">
          {section.type !== 'featured' ? (
            <>
              <label className="home-section-title">{collectionName || getTitle()}</label>
              <ClaimList
                hideFilters
                hideAdvancedFilter
                hideLayoutButton
                tileLayout
                infiniteScroll={false}
                maxClaimRender={maxTilesPerRow}
                useSkeletonScreen={false}
                uris={collectionUrls || claimSearchResults}
              />
            </>
          ) : (
            <FeaturedSection uri={singleClaimUri || (claimSearchResults && claimSearchResults[0])} />
          )}
        </div>
      )}
    </div>
  );
}

export default HomeTabSection;
