// @flow
// This component is entirely for triggering the start of a video claim view
// A video/audio claim will actually be rendered by VideoRenderFloating, which
// will use this component to properly position itself based on the ClaimCoverRender
import React from 'react';

import { ExpandableContext } from 'component/common/expandable';

import Button from 'component/button';
import ClaimCoverRender from 'component/claimCoverRender';

type Props = {
  uri: string,
  children?: any,
  streamClaim: () => void,
  // -- redux --
  doSetMainPlayerDimension: (dimensions: { height: number, width: number }) => void,
};

const VideoClaimInitiator = (props: Props) => {
  const { uri, children, streamClaim, doSetMainPlayerDimension } = props;

  const { setExpanded, disableExpanded } = React.useContext(ExpandableContext) || {};

  function handleClick() {
    streamClaim();

    // In case of inline player where play button is reachable -> set is expanded
    if (setExpanded && disableExpanded) {
      setExpanded(true);
      disableExpanded(true);
    }
  }

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
    <ClaimCoverRender uri={uri} onClick={handleClick} passedRef={playerRef}>
      <Button className="button--icon button--play" onClick={handleClick} iconSize={30} title={__('Play')} />

      {children}
    </ClaimCoverRender>
  );
};

export default VideoClaimInitiator;
