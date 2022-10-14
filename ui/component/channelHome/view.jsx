// @flow
import React, { Fragment } from 'react';
import FileThumbnail from 'component/fileThumbnail';
import ClaimPreviewTile from 'component/claimPreviewTile';
import ClaimList from 'component/claimList';
import ClaimListDiscover from 'component/claimListDiscover';

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
          maxClaimRender={1}
        />
      </div>
      <div>
        <label className="home-segment-title">Uploads</label>
        <ClaimListDiscover
          fetchViewCount
          hideFilters
          hideAdvancedFilter
          hideLayoutButton
          tileLayout
          channelIds={[claimId]}
          infiniteScroll={false}
          maxClaimRender={6}
          // uris={[]}
        />
      </div>
      <section>
        <label className="home-segment-title">Livestreams</label>
      </section>
      <section>
        <label>Shorts</label>
      </section>
      <section>
        <label>Playlists</label>
      </section>
      <br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-
      <br />-<br />-
      <br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-<br />-
      <br />-<br />-
    </div>
  );
}

export default ChannelHome;
