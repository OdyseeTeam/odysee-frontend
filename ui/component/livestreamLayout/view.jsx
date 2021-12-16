// @flow
import { LIVESTREAM_EMBED_URL } from 'constants/livestream';
import React from 'react';
import FileTitleSection from 'component/fileTitleSection';
import { useIsMobile } from 'effects/use-screensize';
import LivestreamScheduledInfo from 'component/livestreamScheduledInfo';
import classnames from 'classnames';
import { lazyImport } from 'util/lazyImport';

const LivestreamComments = lazyImport(() => import('component/livestreamComments' /* webpackChunkName: "comments" */));

type Props = {
  uri: string,
  claim: ?StreamClaim,
  hideComments: boolean,
  release: any,
  isBroadcasting: boolean,
  showLivestream: boolean,
  showScheduledInfo: boolean,
};

export default function LivestreamLayout(props: Props) {
  const { claim, uri, hideComments, release, isBroadcasting, showLivestream, showScheduledInfo } = props;

  const isMobile = useIsMobile();

  if (!claim || !claim.signing_channel) {
    return null;
  }

  const channelName = claim.signing_channel.name;
  const channelClaimId = claim.signing_channel.claim_id;

  return (
    <>
      <div className="section card-stack">
        <div
          className={classnames('file-render file-render--video livestream', {
            'file-render--scheduledLivestream': !showLivestream,
          })}
        >
          <div className="file-viewer">
            {showLivestream && (
              <iframe
                src={`${LIVESTREAM_EMBED_URL}/${channelClaimId}?skin=odysee&autoplay=1`}
                scrolling="no"
                allowFullScreen
              />
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

        {!showScheduledInfo && !isBroadcasting && (
          <div className="help--notice">
            {channelName
              ? __("%channelName% isn't live right now, but the chat is! Check back later to watch the stream.", {
                  channelName,
                })
              : __("This channel isn't live right now, but the chat is! Check back later to watch the stream.")}
          </div>
        )}

        <React.Suspense fallback={null}>{isMobile && !hideComments && <LivestreamComments uri={uri} />}</React.Suspense>

        <FileTitleSection uri={uri} livestream isLive={showLivestream} />
      </div>
    </>
  );
}
