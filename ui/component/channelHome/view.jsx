// @flow
import React, { Fragment } from 'react';
import FileThumbnail from 'component/fileThumbnail';
import ClaimPreviewTile from 'component/claimPreviewTile';
import ClaimList from 'component/claimList';

import './style.scss';

type Props = {
  uri: string,
};

function ChannelHome(props: Props) {
  const { uri } = props;
  // const claimsInChannel = (claim && claim.meta.claims_in_channel) || 0;

  return (
    <>
      <div className="home-section">
        <ClaimList uris="lbry://@Nerdrotic#3/rings-of-power-damage-control,-she-hulk#e" />
      </div>
      <section>
        <label>Uploads</label>
      </section>
      <section>
        <label>Livestreams</label>
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
    </>
  );
}

export default ChannelHome;
