// @flow
import React, { Fragment } from 'react';
import FileThumbnail from 'component/fileThumbnail';
import ClaimPreviewTile from 'component/claimPreviewTile';
import ClaimList from 'component/claimList';
import ClaimListDiscover from 'component/claimListDiscover';

// import './style.scss';

type Props = {
  collectionId: string,
  collectionName: string,
  collectionUrls: ?Array<string>,
};

function PlaylistSection(props: Props) {
  const { collectionId, collectionName, collectionUrls } = props;
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
