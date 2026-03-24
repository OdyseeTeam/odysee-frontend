// @flow
import { lazyImport } from 'util/lazyImport';
import { useIsMobile, useIsMobileLandscape } from 'effects/use-screensize';
import FileTitleSection from 'component/fileTitleSection';
import LivestreamLink from 'component/livestreamLink';
import React from 'react';
import { PRIMARY_PLAYER_WRAPPER_CLASS } from 'constants/player';
import VideoClaimInitiator from 'component/videoClaimInitiator';
import * as ICONS from 'constants/icons';
import MobileTabView from 'component/mobileTabView';
import RecommendedContent from 'component/recommendedContent';

const LivestreamScheduledInfo = lazyImport(() =>
  import('component/livestreamScheduledInfo' /* webpackChunkName: "livestreamScheduledInfo" */)
);
const ChatLayout = lazyImport(() => import('component/chat' /* webpackChunkName: "chat" */));

const VIEW_MODES = {
  CHAT: 'chat',
  SUPERCHAT: 'sc',
};

const LIVESTREAM_TAB_DEFS = [
  { icon: ICONS.INFO, label: 'Info' },
  { icon: ICONS.CHAT, label: 'Chat' },
  { icon: ICONS.DISCOVER, label: 'Related' },
];

type Props = {
  uri: string,
  livestreamChatEnabled: boolean,
  // -- redux --
  activeStreamUri: boolean | string,
  claim: ?StreamClaim,
  chatDisabled: boolean,
  isCurrentClaimLive: boolean,
  showScheduledInfo: boolean,
  superChats: Array<Comment>,
  activeViewers?: number,
  videoTheaterMode: boolean,
  doClearPlayingUri: () => void,
};

export default function LivestreamLayout(props: Props) {
  const {
    uri,
    livestreamChatEnabled,
    // -- redux --
    activeStreamUri,
    claim,
    chatDisabled,
    isCurrentClaimLive,
    showScheduledInfo,
    videoTheaterMode,
    doClearPlayingUri,
  } = props;

  const isMobile = useIsMobile();
  const isLandscapeRotated = useIsMobileLandscape();

  const [hyperchatsHidden] = React.useState(false);
  const [chatViewMode, setChatViewMode] = React.useState(VIEW_MODES.CHAT);

  const liveStatusFetching = activeStreamUri === undefined;

  React.useEffect(() => {
    if (!isCurrentClaimLive) doClearPlayingUri();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [isCurrentClaimLive]);

  if (!claim || !claim.signing_channel) return null;

  const { name: channelName } = claim.signing_channel;
  const isMobilePortrait = isMobile && !isLandscapeRotated;

  const noticeContent =
    !liveStatusFetching && !activeStreamUri && !showScheduledInfo && !isCurrentClaimLive ? (
      <div className="help--notice" style={{ marginTop: '20px' }}>
        {channelName
          ? __("%channelName% isn't live right now, but the chat is! Check back later to watch the stream.", {
              channelName,
            })
          : __("This channel isn't live right now, but the chat is! Check back later to watch the stream.")}
      </div>
    ) : (
      chatDisabled && (
        <div className="help--notice">
          {channelName
            ? __('%channel% has disabled chat for this stream. Enjoy the stream!', { channel: channelName })
            : __('This channel has disabled chat for this stream. Enjoy the stream!')}
        </div>
      )
    );

  if (isMobilePortrait) {
    const infoContent = (
      <section className="file-page__media-actions">
        {noticeContent}
        <LivestreamLink title={__("Click here to access the stream that's currently active")} uri={uri} />
        <FileTitleSection uri={uri} expandOverride />
      </section>
    );

    const chatContent = livestreamChatEnabled ? (
      <React.Suspense fallback={null}>
        <ChatLayout
          uri={uri}
          hyperchatsHidden={hyperchatsHidden}
          customViewMode={chatViewMode}
          setCustomViewMode={(mode) => setChatViewMode(mode)}
        />
      </React.Suspense>
    ) : null;

    const relatedContent = <RecommendedContent uri={uri} />;

    return (
      <section className="card-stack file-page__video">
        <div className={PRIMARY_PLAYER_WRAPPER_CLASS}>
          <VideoClaimInitiator uri={claim.canonical_url}>
            {showScheduledInfo && <LivestreamScheduledInfo uri={claim.canonical_url} />}
          </VideoClaimInitiator>
        </div>

        <MobileTabView
          infoContent={infoContent}
          commentsContent={chatContent}
          relatedContent={relatedContent}
          tabDefs={LIVESTREAM_TAB_DEFS}
        />
      </section>
    );
  }

  return (
    <section className="card-stack file-page__video">
      <div className={PRIMARY_PLAYER_WRAPPER_CLASS}>
        <VideoClaimInitiator uri={claim.canonical_url}>
          {showScheduledInfo && <LivestreamScheduledInfo uri={claim.canonical_url} />}
        </VideoClaimInitiator>
      </div>
      <div className="file-page__secondary-content">
        <div className="file-page__media-actions">
          <div className="section card-stack">
            {noticeContent}
            <LivestreamLink title={__("Click here to access the stream that's currently active")} uri={uri} />
            <FileTitleSection uri={uri} />
          </div>
        </div>

        {(!isMobile || isLandscapeRotated) && videoTheaterMode && livestreamChatEnabled && (
          <React.Suspense fallback={null}>
            <ChatLayout
              uri={uri}
              hyperchatsHidden={hyperchatsHidden}
              customViewMode={chatViewMode}
              setCustomViewMode={(mode) => setChatViewMode(mode)}
            />
          </React.Suspense>
        )}
      </div>
    </section>
  );
}
