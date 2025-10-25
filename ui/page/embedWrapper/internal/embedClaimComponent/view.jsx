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
const ClaimList = lazyImport(() => import('component/claimList' /* webpackChunkName: "claimList" */));

// Note: Prop types are inferred from connected component; avoid TS/Flow in this file to satisfy linters

const EmbedClaimComponent = (props) => {
  const {
    uri,
    latestClaimUrl,
    collectionId,
    // -- redux --
    renderMode,
    isLivestreamClaim,
    showScheduledInfo,
    channelClaimId,
    isCollection,
    streamingUrl,
    doFileGetForUri,
    collectionUrls,
    doFetchItemsInCollection,
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

  // Fetch collection items - must be before any conditional returns
  React.useEffect(() => {
    if (isCollection && collectionId && doFetchItemsInCollection) {
      doFetchItemsInCollection({ collectionId });
    }
  }, [isCollection, collectionId, doFetchItemsInCollection]);

  if (isChannel) {
    if (featureParam && latestClaimUrl !== null) {
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

        {channelClaimId && (
          <div style={{ marginTop: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--color-text)' }}>
              {__('Recent Content')}
            </h2>
            <ClaimListDiscover
              channelIds={[channelClaimId]}
              showHeader={false}
              tileLayout
              pageSize={12}
              claimType={['stream', 'repost']}
              orderBy="release_time"
              hideFilters
            />
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

  // Playlist / Collection embed: show cover + playable list
  if (isCollection && collectionId) {
    return (
      <React.Suspense
        fallback={
          <div className="main--empty">
            <Spinner text={__('Loading playlist...')} />
          </div>
        }
      >
        <ClaimPreview uri={uri} />
        {collectionUrls === undefined ? (
          <div className="main--empty">
            <Spinner text={__('Loading playlist...')} />
          </div>
        ) : collectionUrls && collectionUrls.length > 0 ? (
          <div style={{ marginTop: '16px' }}>
            <ClaimList uris={collectionUrls} tileLayout playItemsOnClick />
          </div>
        ) : (
          <div className="help--notice" style={{ marginTop: '16px' }}>
            {__('This playlist is empty.')}
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

  // Posts (Markdown) embed
  if (renderMode === RENDER_MODES.MARKDOWN) {
    return <EmbeddedMarkdown uri={uri} streamingUrl={streamingUrl} doFileGetForUri={doFileGetForUri} />;
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
const EmbeddedMarkdown = ({ uri, streamingUrl, doFileGetForUri }) => {
  const [content, setContent] = React.useState();

  React.useEffect(() => {
    if (!streamingUrl && doFileGetForUri) {
      doFileGetForUri(uri);
    }
  }, [uri, streamingUrl, doFileGetForUri]);

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

  if (content === undefined) return <Spinner text={__('Loading post...')} />;
  if (content === null) return <div className="help--notice">{__("Sorry, we couldn't load this post.")}</div>;

  return (
    <div className="file-viewer file-viewer--document" style={{ position: 'relative' }}>
      <div className="document file-render__viewer markdown-post">
        <MarkdownPreview content={content} isMarkdownPost promptLinks />
      </div>
    </div>
  );
};
EmbeddedMarkdown.propTypes = {
  uri: PropTypes.string.isRequired,
  streamingUrl: PropTypes.string,
  doFileGetForUri: PropTypes.func,
};

const EmbeddedClaimComponent = ({ uri }) => <ClaimPreviewTile uri={uri} onlyThumb />;
const EmbeddedClaim = withStreamClaimRender(EmbeddedClaimComponent);
EmbeddedClaimComponent.propTypes = {
  uri: PropTypes.string.isRequired,
};

export default EmbedClaimComponent;

EmbedClaimComponent.propTypes = {
  uri: PropTypes.string.isRequired,
  latestClaimUrl: PropTypes.string,
  collectionId: PropTypes.string,
  renderMode: PropTypes.string,
  isLivestreamClaim: PropTypes.bool,
  showScheduledInfo: PropTypes.bool,
  channelClaimId: PropTypes.string,
  isCollection: PropTypes.bool,
  streamingUrl: PropTypes.string,
  doFileGetForUri: PropTypes.func,
  collectionUrls: PropTypes.array,
  doFetchItemsInCollection: PropTypes.func,
};
