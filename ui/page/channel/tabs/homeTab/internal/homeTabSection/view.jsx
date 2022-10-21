// @flow
import React from 'react';
import ClaimList from 'component/claimList';
// import { CsOptions } from 'util/claim-search';

type Props = {
  channelClaimId: string,
  section: any,  
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

  function getTitle(){
    switch(section.type){
      case 'content':
        switch(section.fileType){
          case 'video':
            switch(section.order_by[0]){
              case 'release_time':
                return 'New Videos'
              case 'trending_group':
                return 'Trending Videos'
              case 'effective_amount':
                return 'Top Videos'
            }            
          case 'audio':
            switch(section.order_by[0]){
              case 'release_time':
                return 'New Audio'
              case 'trending_group':
                return 'Trending Audio'
              case 'effective_amount':
                return 'Top Audio'
            }  
          case 'document':
            switch(section.order_by[0]){
              case 'release_time':
                return 'New Posts'
              case 'trending_group':
                return 'Trending Posts'
              case 'effective_amount':
                return 'Top Posts'
            }  
          default:
            return 'Content'
        }        
      case 'playlists':
        return 'Playlists'
    }
  }

  return (
    <>
      <label className="home-segment-title">{collectionName ? collectionName : getTitle()}</label>
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
  );
}

export default HomeTabSection;
