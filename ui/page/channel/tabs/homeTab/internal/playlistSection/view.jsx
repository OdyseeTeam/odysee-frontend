// @flow
import React, { Fragment } from 'react';
import ClaimListDiscover from 'component/claimListDiscover';

type Props = {
  collectionName: string,
  collectionUrls: ?Array<string>,
};

function PlaylistSection(props: Props) {
  const { collectionName, collectionUrls } = props;
  console.log('AAA: ', props);
  return (
    <>
      <label className="home-segment-title">{collectionName}</label>
      <ClaimListDiscover
        fetchViewCount
        hideFilters
        hideAdvancedFilter
        hideLayoutButton
        tileLayout
        infiniteScroll={false}
        maxClaimRender={6}
        useSkeletonScreen={false}
        uris={collectionUrls}
      />
    </>
  );
}

export default PlaylistSection;
