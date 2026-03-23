import React from 'react';
import analytics from 'analytics';
import { formatLbryChannelName } from 'util/url';
import { lazyImport } from 'util/lazyImport';
import { useIsMobile, useIsMobileLandscape } from 'effects/use-screensize';
import { LivestreamContext } from 'contexts/livestream';
import LivestreamLayout from 'component/livestreamLayout';
import LoadingBarOneOff from 'component/loadingBarOneOff';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import * as SETTINGS from 'constants/settings';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectSocketConnectionForId, selectChatCommentsDisabledForUri } from 'redux/selectors/livestream';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectIsUriCurrentlyPlaying } from 'redux/selectors/content';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';
import {
  doCommentSocketConnect as doCommentSocketConnectAction,
  doCommentSocketDisconnect as doCommentSocketDisconnectAction,
} from 'redux/actions/websocket';
const ChatLayout = lazyImport(
  () =>
    import(
      'component/chat'
      /* webpackChunkName: "chat" */
    )
);
type Props = {
  uri: string;
};
export default function LivestreamPage(props: Props) {
  const { uri: propUri } = props;
  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => selectClaimForUri(state, propUri));
  const { claim_id: claimId, canonical_url } = claim || {};
  const uri = canonical_url || '';
  const chatDisabled = useAppSelector((state) => selectChatCommentsDisabledForUri(state, propUri));
  const isStreamPlaying = useAppSelector((state) => selectIsUriCurrentlyPlaying(state, propUri));
  const socketConnection = useAppSelector((state) => selectSocketConnectionForId(state, claimId));
  const theaterMode = useAppSelector((state) => selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE));
  const contentUnlocked =
    claimId && useAppSelector((state) => selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId));
  const doCommentSocketConnect = (
    u: string,
    channelName: string,
    cId: string,
    subCategory: string | null | undefined
  ) => dispatch(doCommentSocketConnectAction(u, channelName, cId, subCategory));
  const doCommentSocketDisconnect = (cId: string, channelName: string) =>
    dispatch(doCommentSocketDisconnectAction(cId, channelName));
  const isMobile = useIsMobile();
  const isLandscapeRotated = useIsMobileLandscape();
  const streamPlayingRef = React.useRef();
  const [layoutRendered, setLayoutRendered] = React.useState(chatDisabled || isMobile);
  const [hyperchatsHidden, setHyperchatsHidden] = React.useState(false);
  const livestreamChatEnabled = !chatDisabled && contentUnlocked;
  const showLivestreamChat = (!isMobile || isLandscapeRotated) && !theaterMode && livestreamChatEnabled;
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
    }; // eslint-disable-next-line react-hooks/exhaustive-deps -- only on unmount -> leave page
  }, []);
  return (
    <LivestreamContext.Provider
      value={{
        livestreamPage: true,
      }}
    >
      {/* -- Prevent layout shift: only render when ChatLayout is already imported otherwise
      the chat will appear and push everything on the page */}
      {(!showLivestreamChat || layoutRendered) && (
        <LivestreamLayout uri={uri} livestreamChatEnabled={livestreamChatEnabled} />
      )}

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
