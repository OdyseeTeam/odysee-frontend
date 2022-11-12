// @flow
// This component is entirely for triggering the start of a video claim view
// A video/audio claim will actually be rendered by VideoRenderFloating, which
// will use this component to properly position itself based on the ClaimCoverRender
import React from 'react';

import { LivestreamContext } from 'contexts/livestream';
import { ExpandableContext } from 'component/common/expandable';

import Button from 'component/button';
import useFetchLiveStatus from 'effects/use-fetch-live';
import ClaimCoverRender from 'component/claimCoverRender';

type Props = {
  uri: string,
  children?: any,
  streamClaim: () => void,
  // -- redux --
  channelClaimId: ?string,
  isLivestreamClaim: boolean,
  doFetchChannelLiveStatus: (string) => void,
};

const VideoClaimInitiator = (props: Props) => {
  const { uri, children, streamClaim, channelClaimId, isLivestreamClaim, doFetchChannelLiveStatus } = props;

  const { setExpanded, disableExpanded } = React.useContext(ExpandableContext) || {};
  const { livestreamPage } = React.useContext(LivestreamContext) || {};

  // in case of a livestream outside of the livestream page component, like embed
  useFetchLiveStatus(isLivestreamClaim && !livestreamPage ? channelClaimId : undefined, doFetchChannelLiveStatus);

  function handleClick() {
    streamClaim();

    // In case of inline player where play button is reachable -> set is expanded
    if (setExpanded && disableExpanded) {
      setExpanded(true);
      disableExpanded(true);
    }
  }
  return (
    <ClaimCoverRender uri={uri} onClick={handleClick}>
      <Button className="button--icon button--play" onClick={handleClick} iconSize={30} title={__('Play')} />

      {children}
    </ClaimCoverRender>
  );
};

export default VideoClaimInitiator;
