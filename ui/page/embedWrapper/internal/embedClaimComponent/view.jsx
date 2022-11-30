// @flow
import React from 'react';

import * as RENDER_MODES from 'constants/file_render_modes';

import { useHistory } from 'react-router';
import { parseURI } from 'util/lbryURI';
import { lazyImport } from 'util/lazyImport';

import withStreamClaimRender from 'hocs/withStreamClaimRender';
import Spinner from 'component/spinner';

const ClaimPreviewTile = lazyImport(() =>
  import('component/claimPreviewTile' /* webpackChunkName: "claimPreviewTile" */)
);
const ClaimPreview = lazyImport(() => import('component/claimPreview' /* webpackChunkName: "claimPreview" */));
const VideoRender = lazyImport(() => import('component/videoClaimRender' /* webpackChunkName: "videoClaimRender" */));

type Props = {
  uri: string,
  latestClaimUrl: ?string,
  // -- redux --
  renderMode: string,
};

const EmbedClaimComponent = (props: Props) => {
  const {
    uri,
    latestClaimUrl,
    // -- redux --
    renderMode,
  } = props;

  const {
    location: { search },
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  const featureParam = urlParams.get('feature');

  const { isChannel } = parseURI(uri);
  const isVideo = RENDER_MODES.FLOATING_MODES.includes(renderMode);

  if (isChannel) {
    if (featureParam && latestClaimUrl !== null) {
      // -- Still loading the latest/livenow claims for the channel
      return (
        <div className="main--empty">
          <Spinner />
        </div>
      );
    }

    return (
      <React.Suspense
        fallback={
          <div className="main--empty">
            <Spinner text={__('Loading...')} />
          </div>
        }
      >
        <ClaimPreview uri={uri} />
      </React.Suspense>
    );
  }

  if (isVideo) {
    return <EmbeddedVideoClaim uri={uri} embedded />;
  }

  return <EmbeddedClaim uri={uri} />;
};

const EmbeddedVideoClaimComponent = ({ uri, streamClaim }: { uri: string, streamClaim: () => void }) => (
  <VideoRender uri={uri} embedded streamClaim={streamClaim} />
);
const EmbeddedVideoClaim = withStreamClaimRender(EmbeddedVideoClaimComponent);

const EmbeddedClaimComponent = ({ uri }: { uri: string }) => <ClaimPreviewTile uri={uri} onlyThumb />;
// -- this allows rendering the appropriate restricted overlays linking to join from the embed --
const EmbeddedClaim = withStreamClaimRender(EmbeddedClaimComponent);

export default EmbedClaimComponent;
