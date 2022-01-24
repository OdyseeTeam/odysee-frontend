// @flow
import { lazyImport } from 'util/lazyImport';
import { useIsMobile } from 'effects/use-screensize';
import classnames from 'classnames';
import FileTitleSection from 'component/fileTitleSection';
import LivestreamLink from 'component/livestreamLink';
import LivestreamScheduledInfo from 'component/livestreamScheduledInfo';
import React from 'react';
import FileRenderInitiator from 'component/fileRenderInitiator';

const LivestreamChatLayout = lazyImport(() => import('component/livestreamChatLayout' /* webpackChunkName: "chat" */));

export const PRIMARY_PLAYER_WRAPPER_CLASS = 'file-page__video-container';

type Props = {
  activeStreamUri: boolean | string,
  claim: ?StreamClaim,
  hideComments: boolean,
  isCurrentClaimLive: boolean,
  release: any,
  showLivestream: boolean,
  showScheduledInfo: boolean,
  uri: string,
};

export default function LivestreamLayout(props: Props) {
  const {
    activeStreamUri,
    claim,
    hideComments,
    isCurrentClaimLive,
    release,
    showLivestream,
    showScheduledInfo,
    uri,
  } = props;

  const isMobile = useIsMobile();

  if (!claim || !claim.signing_channel) return null;

  const { name: channelName } = claim.signing_channel;

  return (
    <>
      <div className="section card-stack">
        <div
          className={classnames('file-render file-render--video', {
            'file-render--scheduledLivestream': !showLivestream,
          })}
        >
          <div className="file-viewer">
            {showLivestream && (
              <div className={PRIMARY_PLAYER_WRAPPER_CLASS}>
                <FileRenderInitiator uri={uri} videoTheaterMode={false} />
              </div>
            )}

            {showScheduledInfo && <LivestreamScheduledInfo release={release} />}
          </div>
        </div>

        {hideComments && !showScheduledInfo && (
          <div className="help--notice">
            {channelName
              ? __('%channel% has disabled chat for this stream. Enjoy the stream!', { channel: channelName })
              : __('This channel has disabled chat for this stream. Enjoy the stream!')}
          </div>
        )}

        {!activeStreamUri && !showScheduledInfo && !isCurrentClaimLive && (
          <div className="help--notice">
            {channelName
              ? __("%channelName% isn't live right now, but the chat is! Check back later to watch the stream.", {
                  channelName,
                })
              : __("This channel isn't live right now, but the chat is! Check back later to watch the stream.")}
          </div>
        )}

        {activeStreamUri && (
          <LivestreamLink
            title={__("Click here to access the stream that's currently active")}
            claimUri={activeStreamUri}
          />
        )}

        {isMobile && !hideComments && (
          <React.Suspense fallback={null}>
            <LivestreamChatLayout uri={uri} />
          </React.Suspense>
        )}

        <FileTitleSection uri={uri} livestream isLive={showLivestream} />
      </div>
    </>
  );
}
