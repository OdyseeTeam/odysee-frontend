// @flow
import { formatLbryChannelName } from 'util/url';
import { lazyImport } from 'util/lazyImport';
import { LIVESTREAM_STARTS_SOON_BUFFER, LIVESTREAM_STARTED_RECENTLY_BUFFER } from 'constants/livestream';
import analytics from 'analytics';
import LivestreamLayout from 'component/livestreamLayout';
import moment from 'moment';
import React from 'react';
import { useIsMobile, useIsMobileLandscape } from 'effects/use-screensize';

import { LivestreamContext } from 'contexts/livestream';

const ChatLayout = lazyImport(() => import('component/chat' /* webpackChunkName: "chat" */));

type Props = {
  activeLivestreamForChannel: any,
  activeLivestreamInitialized: boolean,
  chatDisabled: boolean,
  claim: StreamClaim,
  uri: string,
  socketConnection: { connected: ?boolean },
  isStreamPlaying: boolean,
  doCommentSocketConnect: (uri: string, channelName: string, claimId: string, subCategory: ?string) => void,
  doCommentSocketDisconnect: (claimId: string, channelName: string) => void,
  theaterMode?: Boolean,
  contentUnlocked: boolean,
};

export default function LivestreamPage(props: Props) {
  const {
    activeLivestreamForChannel,
    activeLivestreamInitialized,
    chatDisabled,
    claim,
    uri,
    socketConnection,
    isStreamPlaying,
    doCommentSocketConnect,
    doCommentSocketDisconnect,
    theaterMode,
    contentUnlocked,
  } = props;

  const isMobile = useIsMobile();
  const isLandscapeRotated = useIsMobileLandscape();

  const streamPlayingRef = React.useRef();

  const [activeStreamUri, setActiveStreamUri] = React.useState(false);
  const [showLivestream, setShowLivestream] = React.useState(false);
  const [showScheduledInfo, setShowScheduledInfo] = React.useState(false);
  const [hideComments, setHideComments] = React.useState(false);
  const [layoutRendered, setLayoutRendered] = React.useState(chatDisabled || isMobile);

  const isInitialized = Boolean(activeLivestreamForChannel) || activeLivestreamInitialized;
  const isChannelBroadcasting = Boolean(activeLivestreamForChannel);
  const claimId = claim && claim.claim_id;
  const isCurrentClaimLive = isChannelBroadcasting && activeLivestreamForChannel.claimId === claimId;

  const releaseTime: moment = moment.unix(claim?.value?.release_time || 0);

  const [hyperchatsHidden, setHyperchatsHidden] = React.useState(false);

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

  React.useEffect(() => {
    setActiveStreamUri(!isCurrentClaimLive && isChannelBroadcasting ? activeLivestreamForChannel.claimUri : false);
  }, [isCurrentClaimLive, isChannelBroadcasting]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!isInitialized) return;

    const claimReleaseInFuture = () => releaseTime.isAfter();
    const claimReleaseInPast = () => releaseTime.isBefore();

    const claimReleaseStartingSoon = () =>
      releaseTime.isBetween(moment(), moment().add(LIVESTREAM_STARTS_SOON_BUFFER, 'minutes'));

    const claimReleaseStartedRecently = () =>
      releaseTime.isBetween(moment().subtract(LIVESTREAM_STARTED_RECENTLY_BUFFER, 'minutes'), moment());

    const checkShowLivestream = () =>
      isChannelBroadcasting &&
      isCurrentClaimLive &&
      (claimReleaseInPast() || claimReleaseStartingSoon() || claimReleaseInFuture());

    const checkShowScheduledInfo = () =>
      (!isChannelBroadcasting && (claimReleaseInFuture() || claimReleaseStartedRecently())) ||
      (isChannelBroadcasting &&
        ((!isCurrentClaimLive && (claimReleaseInFuture() || claimReleaseStartedRecently())) ||
          (isCurrentClaimLive && claimReleaseInFuture() && !claimReleaseStartingSoon())));

    const checkCommentsDisabled = () => chatDisabled || (claimReleaseInFuture() && !claimReleaseStartingSoon());

    const calculateStreamReleaseState = () => {
      setShowLivestream(checkShowLivestream());
      setShowScheduledInfo(checkShowScheduledInfo());
      setHideComments(checkCommentsDisabled());
    };

    calculateStreamReleaseState();
    const intervalId = setInterval(calculateStreamReleaseState, 5000);

    if (isCurrentClaimLive && claimReleaseInPast() && isChannelBroadcasting === true) {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [chatDisabled, isChannelBroadcasting, releaseTime, isCurrentClaimLive, isInitialized]);

  return (
    <LivestreamContext.Provider value={{ livestreamPage: true, layoutRendered }}>
      <LivestreamLayout
        uri={uri}
        hideComments={hideComments}
        releaseTimeMs={releaseTime.unix() * 1000}
        isCurrentClaimLive={isCurrentClaimLive}
        showLivestream={showLivestream}
        showScheduledInfo={showScheduledInfo}
        activeStreamUri={activeStreamUri}
        theaterMode={theaterMode}
      />

      {(!isMobile || isLandscapeRotated) && !theaterMode && !hideComments && contentUnlocked && (
        <React.Suspense fallback={null}>
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
