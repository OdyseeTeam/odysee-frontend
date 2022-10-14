// @flow
import React, { Fragment } from 'react';
import FileThumbnail from 'component/fileThumbnail';
import ClaimPreviewTile from 'component/claimPreviewTile';
import ClaimList from 'component/claimList';
import ClaimListDiscover from 'component/claimListDiscover';
import ChannelContent from 'component/channelContent';

import './style.scss';

type Props = {
  uri: string,
  claim: Claim,
};

function ChannelHome(props: Props) {
  const { uri, claim } = props;
  const claimId = claim && claim.claim_id;
  console.log('props: ', props);
  // const claimsInChannel = (claim && claim.meta.claims_in_channel) || 0;

  return (
    <div className="home-tab">
      <div>
        <ClaimListDiscover
          fetchViewCount
          hideFilters
          hideAdvancedFilter
          hideLayoutButton
          channelIds={[claimId]}
          infiniteScroll={false}
          useSkeletonScreen={false}
          maxClaimRender={1}
        />
      </div>
      <div>
        <label className="home-segment-title">Content</label>
        <ClaimListDiscover
          fetchViewCount
          hideFilters
          hideAdvancedFilter
          hideLayoutButton
          tileLayout
          channelIds={[claimId]}
          infiniteScroll={false}
          maxClaimRender={6}
          useSkeletonScreen={false}
          // uris={[]}
        />
      </div>
      <section>
        <label className="home-segment-title">Playlists</label>
        <ChannelContent
          claimType={'collection'}
          uri={uri}
          // channelIsBlackListed={channelIsBlackListed}
          viewHiddenChannels
          // empty={collectionEmpty}
          totalPages={1}
          defaultPageSize={1}
          defaultInfiniteScroll={false}
          params={{ page: 1 }}
        />
      </section>
      <section>
        <label>Channels</label>
      </section>
      <section>
        <label>Members</label>
      </section>
      <br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-
      <br />-<br />-
      <br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-
      <br />-<br />-
    </div>
  );
}

export default ChannelHome;
