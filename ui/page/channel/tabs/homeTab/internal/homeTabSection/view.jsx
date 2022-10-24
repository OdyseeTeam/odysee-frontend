// @flow
import React from 'react';
import ClaimList from 'component/claimList';
import FeaturedSection from '../featuredSection';
// import Button from 'component/button';

type Props = {
  section: any,
  editMode: boolean,
  handleEditCollection: (any) => void,
  // --- select ---
  claimSearchResults: { [string]: Array<string> },
  collectionUrls: ?Array<string>,
  collectionName: string,
  optionsStringified: string,
  fetchingClaimSearch: boolean,
  doClaimSearch: ({}) => void,
  publishedCollections: CollectionGroup,
};

function HomeTabSection(props: Props) {
  const {
    section,
    editMode,
    handleEditCollection,
    claimSearchResults,
    collectionUrls,
    collectionName,
    optionsStringified,
    fetchingClaimSearch,
    doClaimSearch,
    publishedCollections,
  } = props;

  const timedOut = claimSearchResults === null;
  const shouldPerformSearch = !fetchingClaimSearch && !timedOut && !claimSearchResults && !collectionUrls;
  const publishedList = (Object.keys(publishedCollections || {}): any);

  React.useEffect(() => {
    if (shouldPerformSearch) {
      const searchOptions = JSON.parse(optionsStringified);
      doClaimSearch(searchOptions);
    }
  }, [doClaimSearch, shouldPerformSearch]);

  function getTitle() {
    switch (section.type) {
      case 'featured':
        return null;
      case 'content':
        switch (section.file_type) {
          case 'video':
            switch (section.order_by[0]) {
              case 'release_time':
                return 'New Videos';
              case 'trending_group':
                return 'Trending Videos';
              case 'effective_amount':
                return 'Top Videos';
            }
            break;
          case 'audio':
            switch (section.order_by[0]) {
              case 'release_time':
                return 'New Audio';
              case 'trending_group':
                return 'Trending Audio';
              case 'effective_amount':
                return 'Top Audio';
            }
            break;
          case 'document':
            switch (section.order_by[0]) {
              case 'release_time':
                return 'New Posts';
              case 'trending_group':
                return 'Trending Posts';
              case 'effective_amount':
                return 'Top Posts';
            }
            break;
          default:
            return 'Content';
        }
        break;
      case 'playlists':
        return 'Playlists';
      default:
        return section && SectionHeader();
    }
  }

  const SectionHeader = (e) => {
    // console.log('AAA e: ', e);
    return (
      e && (
        <div className="home-section-header-wrapper">
          <div className="home-section-header-option">
            <label>{__('Type')}</label>
            <select
              name="type"
              value={e.section.type || 'select'}
              defaultValue="select"
              onChange={(e) => handleEditCollection({ change: { field: e.target.name, value: e.target.value } })}
            >
              <option value="select" disabled="disabled">
                {__('Select')}
              </option>
              <option value="featured">{__('Featured')}</option>
              <option value="content">{__('Content')}</option>
              <option value="playlists">{__('Playlists')}</option>
              <option value="playlist">{__('Playlist')}</option>
              <option value="reposts">{__('Reposts')}</option>
            </select>
          </div>
          {e.section.type === 'content' && (
            <div className="home-section-header-option">
              <label>{__('File Type')}</label>
              <select
                name="file_type"
                value={e.section.file_type || 'all'}
                defaultValue="all"
                onChange={(e) => handleEditCollection({ change: { field: e.target.name, value: e.target.value } })}
              >
                <option value="all">{__('Show All')}</option>
                <option value="video">{__('Videos')}</option>
                <option value="audio">{__('Audio')}</option>
                <option value="document">{__('Posts')}</option>
                <option value="image">{__('Images')}</option>
              </select>
            </div>
          )}
          {e.section.type === 'playlist' && (
            <div className="home-section-header-option">
              <label>{__('Playlist')}</label>
              <select
                name="claimId"
                value={e.section.claimId || 'select'}
                defaultValue="select"
                onChange={(e) => handleEditCollection({ change: { field: e.target.name, value: e.target.value } })}
              >
                <option value="select">Select a Playlist</option>
                {publishedList &&
                  publishedList.map((list) => {
                    return <option value={publishedCollections[list].id}>{publishedCollections[list].name}</option>;
                  })}
              </select>
            </div>
          )}
          {(e.section.type === 'content' || e.section.type === 'playlists') && (
            <div className="home-section-header-option">
              <label>{__('Order By')}</label>
              <select
                name="order_by"
                value={(e.section.order_by && e.section.order_by[0]) || 'release_time'}
                defaultValue="release_time"
                onChange={(e) => handleEditCollection({ change: { field: e.target.name, value: e.target.value } })}
              >
                <option value="release_time">{__('New')}</option>
                <option value="trending_group">{__('Trending')}</option>
                <option value="effective_amount">{__('Top')}</option>
              </select>
            </div>
          )}
        </div>
      )
    );
  };

  return (
    <div className="home-section-content">
      {editMode && <SectionHeader section={section} />}
      <div className="section">
        {section.type !== 'featured' ? (
          <>
            <label className="home-section-title">{collectionName || getTitle()}</label>
            <ClaimList
              fetchViewCount
              hideFilters
              hideAdvancedFilter
              hideLayoutButton
              tileLayout
              infiniteScroll={false}
              maxClaimRender={6}
              useSkeletonScreen={false}
              uris={collectionUrls || claimSearchResults}
            />
          </>
        ) : (
          <>
            <FeaturedSection uri={claimSearchResults && claimSearchResults[0]} />
          </>
        )}
      </div>
    </div>
  );
}

export default HomeTabSection;
