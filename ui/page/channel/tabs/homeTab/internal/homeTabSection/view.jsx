// @flow
import React from 'react';
import ClaimList from 'component/claimList';
import Button from 'component/button';

type Props = {
  channelClaimId: string,
  section: any,
  editMode: boolean,
  // --- select ---
  claimSearchResults: { [string]: Array<string> },
  collectionUrls: ?Array<string>,
  collectionName: string,
  optionsStringified: string,
  fetchingClaimSearch: boolean,
  doClaimSearch: ({}) => void,
};

function HomeTabSection(props: Props) {
  const {
    section,
    editMode,
    claimSearchResults,
    collectionUrls,
    collectionName,
    optionsStringified,
    fetchingClaimSearch,
    doClaimSearch,
  } = props;

  const timedOut = claimSearchResults === null;
  const shouldPerformSearch = !fetchingClaimSearch && !timedOut && !claimSearchResults && !collectionUrls;
  React.useEffect(() => {
    if (shouldPerformSearch) {
      const searchOptions = JSON.parse(optionsStringified);
      // console.log('searchOptions: ', searchOptions);
      doClaimSearch(searchOptions);
    }
  }, [doClaimSearch, shouldPerformSearch]);

  function getTitle() {
    switch (section.type) {
      case 'featured':
        return null;
      case 'content':
        switch (section.fileType) {
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
        return SectionHeader();
    }
  }

  function handleChangeNewSectionType(e) {}
  function handleSaveHomeSection() {}

  const SectionHeader = (e) => {
    // console.log('e: ', e);
    return (
      <div className="home-section-header-wrapper">
        <div className="home-section-header-option">
          <label>{__('Type')}</label>
          <select value={e.section.type} defaultValue="select" onChange={(e) => handleChangeNewSectionType(e)}>
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
            <select value={e.section.file_type}>
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
            <select>
              <option>Select a Playlist</option>
              <option>My Playlists...</option>
            </select>
          </div>
        )}
        {(e.section.type === 'content' || e.section.type === 'playlists' || e.section.type === 'playlist') && (
          <div className="home-section-header-option">
            <label>{__('Order By')}</label>
            <select value={e.section.order_by}>
              <option value="new">{__('New')}</option>
              <option value="trending">{__('Trending')}</option>
              <option value="top">{__('Top')}</option>
            </select>
          </div>
        )}
        <div className="home-section-header-option">
          <Button
            label={__('Save Section')}
            button="primary"
            // disabled={sectionCount > 0}
            onClick={() => handleSaveHomeSection()}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="home-section-content">
      {editMode && <SectionHeader section={section} />}
      <div className="section">
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
      </div>
    </div>
  );
}

export default HomeTabSection;
