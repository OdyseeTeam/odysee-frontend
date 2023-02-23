// @flow
import React from 'react';

import * as RENDER_MODES from 'constants/file_render_modes';

import { v4 as uuid } from 'uuid';
import { INLINE_PLAYER_WRAPPER_CLASS } from 'constants/player';

import Button from 'component/button';
import VideoRender from 'component/videoClaimRender';
import FileViewerEmbeddedTitle from 'component/fileViewerEmbeddedTitle';
import ClaimPreviewTile from 'component/claimPreviewTile';

import withStreamClaimRender from 'hocs/withStreamClaimRender';
import withLiveStatus from 'hocs/withLiveStatus';

type Props = {
  uri: string,
  parentCommentId?: string,
  // -- redux --
  playingUri: PlayingUri,
  renderMode: string,
  isLivestreamClaim: ?boolean,
};

const ClaimLinkPreview = (props: Props) => {
  const { uri, parentCommentId, playingUri, renderMode, isLivestreamClaim } = props;

  // each claimLink in a page will have a unique id for identifying duplicates (same URI multiple times)
  const claimLinkIdRef = React.useRef(uuid());
  const claimLinkId = claimLinkIdRef.current;

  const StreamComponent = React.useMemo(() => withStreamClaimRender(VideoRender), []);
  const LivestreamComponent = React.useMemo(() => withLiveStatus(StreamComponent), [StreamComponent]);

  const Component = React.useMemo(
    () => (isLivestreamClaim ? (props: any) => <LivestreamComponent {...props} forceRender /> : StreamComponent),
    [StreamComponent, isLivestreamClaim]
  );

  const PreviewLinkButton = React.useMemo(
    () => () =>
      (
        <div className="preview-link__url">
          <Button button="link" label={uri} navigate={uri} />
        </div>
      ),
    [uri]
  );

  const currentUriPlaying = playingUri.uri === uri && claimLinkId === playingUri.sourceId;

  // -- Floating Render Claims are able to be played inline from the claim link
  if (RENDER_MODES.FLOATING_MODES.includes(renderMode)) {
    return (
      <>
        <div className={INLINE_PLAYER_WRAPPER_CLASS} id={claimLinkId}>
          {!currentUriPlaying && <FileViewerEmbeddedTitle uri={uri} />}

          <Component uri={uri} embedded claimLinkId={claimLinkId} parentCommentId={parentCommentId} />
        </div>

        <PreviewLinkButton />
      </>
    );
  }

  return (
    <>
      <FileViewerEmbeddedTitle uri={uri} />
      <ClaimPreviewTile uri={uri} onlyThumb />
      <PreviewLinkButton />
    </>
  );
};

export default ClaimLinkPreview;
