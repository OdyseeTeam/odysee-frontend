// @flow
// This component is entirely for triggering the start of a video claim view
// A video/audio claim will actually be rendered by VideoRenderFloating, which
// will use this component to properly position itself based on the ClaimCoverRender
import React from 'react';

import Button from 'component/button';
import ClaimCoverRender from 'component/claimCoverRender';

type Props = {
  // -- withStreamClaimRender --
  uri: string,
  children?: any,
  streamClaim: () => void,
  // -- redux --
  doSetMainPlayerDimension: (dimensions: { height: number, width: number }) => void,
};

const VideoClaimInitiator = (props: Props) => {
  const { uri, children, streamClaim, doSetMainPlayerDimension } = props;

  const playerRef = React.useCallback(
    (node) => {
      if (node) {
        const rect = node.getBoundingClientRect();
        doSetMainPlayerDimension(rect);
      }
    },
    [doSetMainPlayerDimension]
  );

  return (
    <ClaimCoverRender uri={uri} onClick={streamClaim} passedRef={playerRef}>
      <Button className="button--icon button--play" onClick={streamClaim} iconSize={30} title={__('Play')} />
      {children}
    </ClaimCoverRender>
  );
};

export default VideoClaimInitiator;
