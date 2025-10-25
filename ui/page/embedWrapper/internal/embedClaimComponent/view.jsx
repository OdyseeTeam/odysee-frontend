// @noflow
import React from 'react';
import classnames from 'classnames';

import * as RENDER_MODES from 'constants/file_render_modes';

import { useHistory } from 'react-router';
import { parseURI } from 'util/lbryURI';
import { lazyImport } from 'util/lazyImport';
import MarkdownPreview from 'component/common/markdown-preview';
import { formatLbryUrlForWeb } from 'util/url';
import PropTypes from 'prop-types';

import withStreamClaimRender from 'hocs/withStreamClaimRender';
import Spinner from 'component/spinner';
import I18nMessage from 'component/i18nMessage';
import Button from 'component/button';

const LivestreamScheduledInfo = lazyImport(() =>
  import('component/livestreamScheduledInfo' /* webpackChunkName: "livestreamScheduledInfo" */)
);
const ClaimPreviewTile = lazyImport(() =>
  import('component/claimPreviewTile' /* webpackChunkName: "claimPreviewTile" */)
);
const ClaimPreview = lazyImport(() => import('component/claimPreview' /* webpackChunkName: "claimPreview" */));
const VideoRender = lazyImport(() => import('component/videoClaimRender' /* webpackChunkName: "videoClaimRender" */));
const ClaimListDiscover = lazyImport(() =>
  import('component/claimListDiscover' /* webpackChunkName: "claimListDiscover" */)
);

// Note: Prop types are inferred from connected component; avoid TS/Flow in this file to satisfy linters

const EmbedClaimComponent = (props) => {
  const {
    uri,
    latestClaimUrl,
    // -- redux --
    renderMode,
    isLivestreamClaim,
    showScheduledInfo,
    channelClaimId,
    isCollection,
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

        {/* Channel embed: show latest uploads grid */}
        {channelClaimId && (
          <div style={{ marginTop: '16px' }}>
            <ClaimListDiscover isChannel channelIds={[channelClaimId]} showHeader={false} tileLayout pageSize={6} />
          </div>
        )}

        {latestClaimUrl === null && (
          <div className="help--notice" style={{ marginTop: '20px' }}>
            {__("%channelName% isn't live right now, check back later to watch the stream.", { channelName })}
          </div>
        )}
      </React.Suspense>
    );
  }

  // Playlist / Collection embed: show cover + playable list (uses existing ClaimPreviewTile behavior)
  if (isCollection) {
    return (
      <React.Suspense
        fallback={
          <div className="main--empty">
            <Spinner text={__('Loading playlist...')} />
          </div>
        }
      >
        <ClaimPreview uri={uri} />
        <div style={{ marginTop: '16px' }}>
          <ClaimListDiscover showHeader={false} uris={[uri]} tileLayout pageSize={12} />
        </div>
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

  // Posts (Markdown) embed
  if (renderMode === RENDER_MODES.MARKDOWN) {
    return <EmbeddedMarkdownClaim uri={uri} embedded />;
  }

  return <EmbeddedClaim uri={uri} />;
};

// eslint-disable-next-line react/prop-types
const EmbeddedVideoClaimComponent = ({ uri, streamClaim }) => (
  <VideoRender uri={uri} embedded streamClaim={streamClaim} />
);
const EmbeddedVideoClaim = withStreamClaimRender(EmbeddedVideoClaimComponent);
EmbeddedVideoClaimComponent.propTypes = {
  uri: PropTypes.string.isRequired,
  streamClaim: PropTypes.func,
};

// Minimal Markdown Embed Viewer: fetch content and render markdown
// eslint-disable-next-line react/prop-types
const EmbeddedMarkdownClaimComponent = ({ uri, streamingUrl }) => {
  const [content, setContent] = React.useState();

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!streamingUrl) return setContent(undefined);
        const res = await fetch(streamingUrl, { credentials: 'omit' });
        if (!res.ok) return setContent(null);
        const text = await res.text();
        if (!cancelled) setContent(text);
      } catch (e) {
        if (!cancelled) setContent(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [streamingUrl]);

  if (content === undefined) return <Spinner />;
  if (content === null) return <div className="help--notice">{__("Sorry, we couldn't load this post.")}</div>;

  return (
    <div className="file-viewer file-viewer--document">
      <MarkdownPreview content={content} isMarkdownPost promptLinks />
    </div>
  );
};
const EmbeddedMarkdownClaim = withStreamClaimRender(EmbeddedMarkdownClaimComponent);
EmbeddedMarkdownClaimComponent.propTypes = {
  uri: PropTypes.string.isRequired,
  streamingUrl: PropTypes.string,
};

const EmbeddedClaimComponent = ({ uri }) => <ClaimPreviewTile uri={uri} onlyThumb />;
// -- this allows rendering the appropriate restricted overlays linking to join from the embed --
const EmbeddedClaim = withStreamClaimRender(EmbeddedClaimComponent);
EmbeddedClaimComponent.propTypes = {
  uri: PropTypes.string.isRequired,
};

export default EmbedClaimComponent;

EmbedClaimComponent.propTypes = {
  uri: PropTypes.string.isRequired,
  latestClaimUrl: PropTypes.string,
  renderMode: PropTypes.string,
  isLivestreamClaim: PropTypes.bool,
  showScheduledInfo: PropTypes.bool,
  channelClaimId: PropTypes.string,
  isCollection: PropTypes.bool,
};
