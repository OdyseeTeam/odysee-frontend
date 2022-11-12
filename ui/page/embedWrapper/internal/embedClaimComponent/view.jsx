// @flow
import React from 'react';

import * as RENDER_MODES from 'constants/file_render_modes';

import { parseURI } from 'util/lbryURI';

import ClaimPreviewTile from 'component/claimPreviewTile';
import VideoRender from 'component/videoClaimRender';

import withStreamClaimRender from 'hocs/withStreamClaimRender';

type Props = {
  uri: string,
  // -- redux --
  renderMode: string,
};

const EmbedClaimComponent = (props: Props) => {
  const {
    uri,
    // -- redux --
    renderMode,
  } = props;

  const { isChannel } = parseURI(uri);
  const isVideo = RENDER_MODES.FLOATING_MODES.includes(renderMode);

  if (isChannel) {
    return null;
    // return (
    //   <>
    //     <UriIndicator uri={uri} link showAtSign />
    //     <span>{fullUri.length > uri.length ? fullUri.substring(uri.length, fullUri.length) : ''}</span>
    //   </>
    // );
  }

  if (isVideo) {
    return <EmbeddedClaim uri={uri} embedded />;
  }

  return <ClaimPreviewTile uri={uri} onlyThumb />;
};

const EmbeddedClaimComponent = ({ uri, streamClaim }: { uri: string, streamClaim: () => void }) => (
  <VideoRender uri={uri} embedded streamClaim={streamClaim} />
);

const EmbeddedClaim = withStreamClaimRender(EmbeddedClaimComponent);

export default EmbedClaimComponent;
