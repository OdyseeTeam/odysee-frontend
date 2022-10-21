// @flow
import React from 'react';
import ClaimListDiscover from 'component/claimListDiscover';
import { CsOptions } from 'util/claim-search';

type Props = {
  // --- select ---
  // urls: Array<string>,
  claimSearchResults: { [string]: Array<string> },
  optionsStringified: string,
  fetchingClaimSearch: boolean,

  // --- perform ---
  doClaimSearch: ({}) => void,
};

function HomeTabSection(props: Props) {
  const {
    // urls,
    claimSearchResults,
    optionsStringified,
    fetchingClaimSearch,
    doClaimSearch,
  } = props;

  // console.log('urls: ', urls)
  // console.log('CsOptions: ', CsOptions)
  console.log('claimSearchResults: ', claimSearchResults);

  /*
  React.useEffect(() => {
    fetchClaimListMine(1, 6, true, 'stream,repost'.split(','));
  }, []);  
  */

  const timedOut = claimSearchResults === null;
  // const shouldPerformSearch = !fetchingClaimSearch && !timedOut && claimSearchUris.length === 0;
  const shouldPerformSearch = !fetchingClaimSearch && !timedOut;

  // let shouldPerformSearch = true
  React.useEffect(() => {
    if (shouldPerformSearch) {
      const searchOptions = JSON.parse(optionsStringified);
      console.log('searchOptions: ', searchOptions);
      doClaimSearch(searchOptions);
    }
  }, [doClaimSearch, shouldPerformSearch]);

  return (
    <>
      <label className="home-segment-title">AAAAAAAAAAAAAA</label>
      <ClaimListDiscover
        fetchViewCount
        hideFilters
        hideAdvancedFilter
        hideLayoutButton
        tileLayout
        infiniteScroll={false}
        maxClaimRender={6}
        useSkeletonScreen={false}
        // uris={urls}
      />
    </>
  );
}

export default HomeTabSection;
