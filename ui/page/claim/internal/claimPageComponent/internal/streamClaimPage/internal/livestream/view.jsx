// @flow
import React from 'react';
import analytics from 'analytics';

import { formatLbryChannelName } from 'util/url';
import { lazyImport } from 'util/lazyImport';
import { useIsMobile, useIsMobileLandscape } from 'effects/use-screensize';
import { LivestreamContext } from 'contexts/livestream';

import LivestreamLayout from 'component/livestreamLayout';
import LoadingBarOneOff from 'component/loadingBarOneOff';

const ChatLayout = lazyImport(() => import('component/chat' /* webpackChunkName: "chat" */));

type Props = {
  uri: string,
  // -- redux --
  chatDisabled: boolean,
  claim: StreamClaim,
  socketConnection: { connected: ?boolean },
  isStreamPlaying: boolean,
  theaterMode?: Boolean,
  contentUnlocked: boolean,
  doCommentSocketConnect: (uri: string, channelName: string, claimId: string, subCategory: ?string) => void,
  doCommentSocketDisconnect: (claimId: string, channelName: string) => void,
};

export default function LivestreamPage(props: Props) {
  const {
    uri,
    // -- redux --
    chatDisabled,
    claim,
    socketConnection,
    isStreamPlaying,
    theaterMode,
    contentUnlocked,
    doCommentSocketConnect,
    doCommentSocketDisconnect,
  } = props;

  const isMobile = useIsMobile();
  const isLandscapeRotated = useIsMobileLandscape();

  const streamPlayingRef = React.useRef();

  const [layoutRendered, setLayoutRendered] = React.useState(chatDisabled || isMobile);
  const [hyperchatsHidden, setHyperchatsHidden] = React.useState(false);

  const showLivestreamChat = (!isMobile || isLandscapeRotated) && !theaterMode && !chatDisabled && contentUnlocked;

  React.useEffect(() => {
    // TODO: This should not be needed once we unify the livestream player (?)
    analytics.event.playerLoaded('livestream', false);
  }, []);

  const { signing_channel: channelClaim } = claim || {};
  const { canonical_url: channelUrl } = channelClaim || {};

  // On livestream page, only connect, videoRenderFloating will handle disconnect.
  // (either by leaving page with floating player off, or by closing the player)
  React.useEffect(() => {
    const { claim_id: claimId, signing_channel: channelClaim } = claim;
    const channelName = channelClaim && formatLbryChannelName(channelUrl);

    if (claimId && channelName && !socketConnection?.connected && contentUnlocked) {
      doCommentSocketConnect(uri, channelName, claimId, undefined);
    }
  }, [channelUrl, claim, doCommentSocketConnect, doCommentSocketDisconnect, socketConnection, uri, contentUnlocked]);

  React.useEffect(() => {
    // use for unmount case without triggering render
    streamPlayingRef.current = isStreamPlaying;
  }, [isStreamPlaying]);

  React.useEffect(() => {
    return () => {
      if (!streamPlayingRef.current) {
        const { claim_id: claimId, signing_channel: channelClaim } = claim;
        const channelName = channelClaim && formatLbryChannelName(channelUrl);

        if (claimId && channelName && contentUnlocked) doCommentSocketDisconnect(claimId, channelName);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on unmount -> leave page
  }, []);

  return (
    <LivestreamContext.Provider value={{ livestreamPage: true }}>
      {/* -- Prevent layout shift: only render when ChatLayout is already imported otherwise
      the chat will appear and push everything on the page */}
      {(!showLivestreamChat || layoutRendered) && <LivestreamLayout uri={uri} />}

      {showLivestreamChat && (
        <React.Suspense fallback={<LoadingBarOneOff />}>
          <ChatLayout
            uri={uri}
            hyperchatsHidden={hyperchatsHidden}
            toggleHyperchats={() => setHyperchatsHidden(!hyperchatsHidden)}
            setLayoutRendered={setLayoutRendered}
          />
        </React.Suspense>
      )}
    </LivestreamContext.Provider>
  );
}
