// @noflow
import React from 'react';
import classnames from 'classnames';
import * as RENDER_MODES from 'constants/file_render_modes';
import { useLocation } from 'react-router-dom';
import { parseURI } from 'util/lbryURI';
import { lazyImport } from 'util/lazyImport';
import MarkdownPreview from 'component/common/markdown-preview';
import { formatLbryUrlForWeb } from 'util/url';
import PropTypes from 'prop-types';
import withStreamClaimRender from 'hocs/withStreamClaimRender';
import Spinner from 'component/spinner';
import I18nMessage from 'component/i18nMessage';
import Button from 'component/button';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectClaimForUri, selectIsStreamPlaceholderForUri } from 'redux/selectors/claims';
import { getChannelIdFromClaim } from 'util/claim';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import { selectShowScheduledLiveInfoForUri, selectLatestLiveUriForChannel } from 'redux/selectors/livestream';
import { selectStreamingUrlForUri } from 'redux/selectors/file_info';
import { selectUrlsForCollectionId } from 'redux/selectors/collections';
import { doFileGetForUri } from 'redux/actions/file';
import { doFetchItemsInCollection } from 'redux/actions/collections';
import { doFetchChannelIsLiveForId } from 'redux/actions/livestream';
import withResolvedClaimRender from 'hocs/withResolvedClaimRender';
const LivestreamScheduledInfo = lazyImport(
  () =>
    import(
      'component/livestreamScheduledInfo'
      /* webpackChunkName: "livestreamScheduledInfo" */
    )
);
const ClaimPreviewTile = lazyImport(
  () =>
    import(
      'component/claimPreviewTile'
      /* webpackChunkName: "claimPreviewTile" */
    )
);
const ClaimPreview = lazyImport(
  () =>
    import(
      'component/claimPreview'
      /* webpackChunkName: "claimPreview" */
    )
);
const VideoRender = lazyImport(
  () =>
    import(
      'component/videoClaimRender'
      /* webpackChunkName: "videoClaimRender" */
    )
);
const ClaimListDiscover = lazyImport(
  () =>
    import(
      'component/claimListDiscover'
      /* webpackChunkName: "claimListDiscover" */
    )
);
const ClaimList = lazyImport(
  () =>
    import(
      'component/claimList'
      /* webpackChunkName: "claimList" */
    )
);

// Note: Prop types are inferred from connected component; avoid TS/Flow in this file to satisfy linters
const EmbedClaimComponent = (props) => {
  const { uri, collectionId } = props;
  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const channelClaimId = getChannelIdFromClaim(claim);
  const isCollection = claim?.value_type === 'collection';
  const isChannelClaim = claim?.value_type === 'channel';
  const latestClaimUrl = useAppSelector((state) =>
    isChannelClaim && channelClaimId ? selectLatestLiveUriForChannel(state, channelClaimId) : undefined
  );
  const renderMode = useAppSelector((state) => makeSelectFileRenderModeForUri(uri)(state));
  const isLivestreamClaim = useAppSelector((state) => selectIsStreamPlaceholderForUri(state, uri));
  const showScheduledInfo = useAppSelector((state) => selectShowScheduledLiveInfoForUri(state, uri));
  const streamingUrl = useAppSelector((state) => selectStreamingUrlForUri(state, uri));
  const collectionUrls = useAppSelector((state) =>
    collectionId ? selectUrlsForCollectionId(state, collectionId) : null
  );
  const { search } = useLocation();
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
    if (isCollection && collectionId) {
      dispatch(
        doFetchItemsInCollection({
          collectionId,
        })
      );
    }
  }, [isCollection, collectionId, dispatch]);
  // Fetch livestream status for embedded livestreams and channel embeds with feature=livenow
  React.useEffect(() => {
    if ((isLivestreamClaim || isChannel) && channelClaimId) {
      dispatch(doFetchChannelIsLiveForId(channelClaimId));
    }
  }, [isLivestreamClaim, isChannel, channelClaimId, dispatch]);

  if (isChannel) {
    // For feature=livenow, show the latest livestream if available
    if (featureParam === 'livenow' && latestClaimUrl) {
      return (
        <EmbeddedVideoClaim uri={latestClaimUrl} embedded>
          <div className="help--notice help--notice-embed-livestream">
            <I18nMessage
              tokens={{
                channel_name: channelName,
                click_here: <ClickHereButton />,
              }}
            >
              %channel_name% isn't live right now, but the chat is! Check back later to watch the stream, or
              %click_here% to start chatting.
            </I18nMessage>
          </div>
        </EmbeddedVideoClaim>
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
          <div
            style={{
              marginTop: '16px',
            }}
          >
            <h2
              style={{
                fontSize: '1.2rem',
                marginBottom: '12px',
                color: 'var(--color-text)',
              }}
            >
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

        {latestClaimUrl === null && featureParam === 'livenow' && (
          <div
            className="help--notice"
            style={{
              marginTop: '20px',
            }}
          >
            {__("%channelName% isn't live right now, check back later to watch the stream.", {
              channelName,
            })}
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
          <div
            style={{
              marginTop: '16px',
            }}
          >
            <ClaimList uris={collectionUrls} tileLayout playItemsOnClick />
          </div>
        ) : (
          <div
            className="help--notice"
            style={{
              marginTop: '16px',
            }}
          >
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
                  <I18nMessage
                    tokens={{
                      click_here: <ClickHereButton />,
                    }}
                  >
                    %click_here% if you want to join the chat for this stream.
                  </I18nMessage>
                ) : (
                  <I18nMessage
                    tokens={{
                      channel_name: channelName,
                      click_here: <ClickHereButton />,
                    }}
                  >
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
    return <EmbeddedMarkdown uri={uri} streamingUrl={streamingUrl} />;
  }

  return <EmbeddedClaim uri={uri} />;
};

const EmbeddedVideoClaimComponent = ({ uri, streamClaim }) => (
  <VideoRender uri={uri} embedded streamClaim={streamClaim} />
);

const EmbeddedVideoClaim = withStreamClaimRender(EmbeddedVideoClaimComponent);
EmbeddedVideoClaimComponent.propTypes = {
  uri: PropTypes.string.isRequired,
  streamClaim: PropTypes.object,
};

// Minimal Markdown Embed Viewer: fetch content and render markdown
const EmbeddedMarkdown = ({ uri, streamingUrl }) => {
  const mdDispatch = useAppDispatch();
  const [content, setContent] = React.useState();
  React.useEffect(() => {
    if (!streamingUrl) {
      mdDispatch(doFileGetForUri(uri));
    }
  }, [uri, streamingUrl, mdDispatch]);
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!streamingUrl) return setContent(undefined);
        const res = await fetch(streamingUrl, {
          credentials: 'omit',
        });
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
    <div
      className="file-viewer file-viewer--document"
      style={{
        position: 'relative',
      }}
    >
      <div className="document file-render__viewer markdown-post">
        <MarkdownPreview content={content} isMarkdownPost promptLinks />
      </div>
    </div>
  );
};

EmbeddedMarkdown.propTypes = {
  uri: PropTypes.string.isRequired,
  streamingUrl: PropTypes.string,
};

const EmbeddedClaimComponent = ({ uri }) => <ClaimPreviewTile uri={uri} onlyThumb />;

const EmbeddedClaim = withStreamClaimRender(EmbeddedClaimComponent);
EmbeddedClaimComponent.propTypes = {
  uri: PropTypes.string.isRequired,
};
export default withResolvedClaimRender(EmbedClaimComponent);
EmbedClaimComponent.propTypes = {
  uri: PropTypes.string.isRequired,
  collectionId: PropTypes.string,
};
