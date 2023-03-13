// @flow
import React from 'react';
import classnames from 'classnames';

import * as RENDER_MODES from 'constants/file_render_modes';

import { useHistory } from 'react-router';
import { parseURI } from 'util/lbryURI';
import { lazyImport } from 'util/lazyImport';
import { formatLbryUrlForWeb } from 'util/url';

import withStreamClaimRender from 'hocs/withStreamClaimRender';
import LivestreamScheduledInfo from 'component/livestreamScheduledInfo';
import Spinner from 'component/spinner';
import I18nMessage from 'component/i18nMessage';
import Button from 'component/button';

const ClaimPreviewTile = lazyImport(() =>
  import('component/claimPreviewTile' /* webpackChunkName: "claimPreviewTile" */)
);
const ClaimPreview = lazyImport(() => import('component/claimPreview' /* webpackChunkName: "claimPreview" */));
const VideoRender = lazyImport(() => import('component/videoClaimRender' /* webpackChunkName: "videoClaimRender" */));

type Props = {
  uri: string,
  latestClaimUrl: ?string,
  // -- redux --
  renderMode: string,
  isLivestreamClaim: ?boolean,
  showScheduledInfo: ?boolean,
};

const EmbedClaimComponent = (props: Props) => {
  const {
    uri,
    latestClaimUrl,
    // -- redux --
    renderMode,
    isLivestreamClaim,
    showScheduledInfo,
  } = props;

  const {
    location: { search },
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  const featureParam = urlParams.get('feature');

  const { isChannel, channelName } = parseURI(uri);
  const isVideo = RENDER_MODES.FLOATING_MODES.includes(renderMode);

  const ClickHereButton = React.useMemo(
    () => () => <Button button="link" label={__('Click Here')} href={formatLbryUrlForWeb(uri)} />,
    [uri]
  );

  if (isChannel) {
    if (featureParam && latestClaimUrl !== null) {
      // -- Still loading the latest/livenow claims for the channel
      return (
        <div className="main--empty">
          <Spinner />
        </div>
      );
    }

    return (
      <React.Suspense
        fallback={
          <div className="main--empty">
            <Spinner text={__('Loading...')} />
          </div>
        }
      >
        <ClaimPreview uri={uri} />

        {latestClaimUrl === null && (
          <div className="help--notice" style={{ marginTop: '20px' }}>
            {__("%channelName% isn't live right now, check back later to watch the stream.", { channelName })}
          </div>
        )}
      </React.Suspense>
    );
  }

  if (isVideo) {
    return (
      <>
        <EmbeddedVideoClaim uri={uri} embedded>
          {isLivestreamClaim && (
            <>
              {showScheduledInfo && <LivestreamScheduledInfo uri={uri} />}

              <div
                className={classnames('help--notice help--notice-embed-livestream', {
                  'help--notice-short': showScheduledInfo,
                })}
              >
                {showScheduledInfo ? (
                  <I18nMessage tokens={{ click_here: <ClickHereButton /> }}>
                    %click_here% if you want to join the chat for this stream.
                  </I18nMessage>
                ) : (
                  <I18nMessage tokens={{ channel_name: channelName, click_here: <ClickHereButton /> }}>
                    %channel_name% isn't live right now, but the chat is! Check back later to watch the stream, or
                    %click_here% to start chatting.
                  </I18nMessage>
                )}
              </div>
            </>
          )}
        </EmbeddedVideoClaim>
      </>
    );
  }

  return <EmbeddedClaim uri={uri} />;
};

const EmbeddedVideoClaimComponent = ({ uri, streamClaim }: { uri: string, streamClaim: () => void }) => (
  <VideoRender uri={uri} embedded streamClaim={streamClaim} />
);
const EmbeddedVideoClaim = withStreamClaimRender(EmbeddedVideoClaimComponent);

const EmbeddedClaimComponent = ({ uri }: { uri: string }) => <ClaimPreviewTile uri={uri} onlyThumb />;
// -- this allows rendering the appropriate restricted overlays linking to join from the embed --
const EmbeddedClaim = withStreamClaimRender(EmbeddedClaimComponent);

export default EmbedClaimComponent;
