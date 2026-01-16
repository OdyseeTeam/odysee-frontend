// @flow
import * as PAGES from 'constants/pages';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import React from 'react';
import classnames from 'classnames';
import { useHistory, Redirect } from 'react-router';
import PropTypes from 'prop-types';
import { lazyImport } from 'util/lazyImport';
import * as RENDER_MODES from 'constants/file_render_modes';
import { EmbedContext } from 'contexts/embed';
import Spinner from 'component/spinner';
import { buildURI, normalizeURI, parseURI } from 'util/lbryURI';
import { formatLbryUrlForWeb } from 'util/url';
const ClaimPage = lazyImport(() => import('page/claim' /* webpackChunkName: "claimPage" */));
const CollectionPage = lazyImport(() => import('page/collection' /* webpackChunkName: "collection" */));
const EmbedClaimComponent = lazyImport(() =>
  import('page/embedWrapper/internal/embedClaimComponent' /* webpackChunkName: "embedClaimComponent" */)
);

// Keep uri derivation logic here and delegate full rendering to existing pages

type Props = {
  uri?: string,
  collectionId?: string,
  collectionFirstItemUri?: string,
  isCollection?: boolean,
  renderMode?: string,
  doFetchItemsInCollection?: ({ collectionId: string }) => void,
};

const EmbedWrapperPage = (props: Props) => {
  const [videoEnded, setVideoEnded] = React.useState(false);
  const {
    uri: incomingUri,
    collectionId,
    collectionFirstItemUri,
    isCollection,
    renderMode,
    doFetchItemsInCollection,
  } = props;

  const {
    location: { search, pathname },
    match,
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  const featureParam = urlParams.get('feature');
  const latestContentPath = featureParam === PAGES.LATEST;
  const liveContentPath = featureParam === PAGES.LIVE_NOW;

  // Detect if this is a playlist page URL
  const isPlaylistPath = pathname && pathname.includes('/playlist/');

  // For live/latest content, use the URI from selector (which resolves to the actual stream)
  // Otherwise, try to derive from match first
  let uri;
  if (liveContentPath || latestContentPath) {
    uri = incomingUri;
  } else {
    const matchedPath = buildMatchWithHash(match, window?.location?.hash);
    uri = getUriFromMatch(matchedPath);
    if (!uri) uri = incomingUri;
  }
  const embedLightBackground = urlParams.get('embedBackgroundLight');

  // Fetch collection items when we have a collectionId
  React.useEffect(() => {
    if (collectionId && doFetchItemsInCollection) {
      doFetchItemsInCollection({ collectionId });
    }
  }, [collectionId, doFetchItemsInCollection]);

  // For playlist URLs in embed mode, redirect to first item with lid parameter
  if (isPlaylistPath && collectionId && collectionFirstItemUri) {
    const firstItemPath = formatLbryUrlForWeb(collectionFirstItemUri);
    const redirectUrl = `/$/embed${firstItemPath}?${COLLECTIONS_CONSTS.COLLECTION_ID}=${collectionId}`;
    return <Redirect to={redirectUrl} />;
  }

  // Show loading while waiting for collection first item
  if (isPlaylistPath && collectionId && !collectionFirstItemUri) {
    return (
      <div className="main--empty">
        <Spinner text={__('Loading playlist...')} />
      </div>
    );
  }

  // Determine if this should render like a full page (channels/collections) or minimal (videos/posts)
  const { isChannel } = uri ? parseURI(uri) : { isChannel: false };
  const isMarkdown = renderMode === RENDER_MODES.MARKDOWN;
  const isPageLike = Boolean(isChannel || isCollection || isMarkdown);

  return (
    <EmbedContext.Provider value={{ videoEnded, setVideoEnded }}>
      <div
        className={classnames('embed__wrapper', {
          'embed__wrapper--light-background': embedLightBackground,
          'embed__wrapper--page': isPageLike,
        })}
      >
        <React.Suspense
          fallback={
            <div className="main--empty">
              <Spinner text={__('Loading...')} />
            </div>
          }
        >
          {collectionId && !isPlaylistPath ? (
            <CollectionPage collectionId={collectionId} />
          ) : isPageLike ? (
            <ClaimPage uri={uri} latestContentPath={latestContentPath} liveContentPath={liveContentPath} />
          ) : (
            <EmbedClaimComponent uri={uri} />
          )}
        </React.Suspense>
      </div>
    </EmbedContext.Provider>
  );
};

EmbedWrapperPage.propTypes = {
  uri: PropTypes.string,
  collectionId: PropTypes.string,
  collectionFirstItemUri: PropTypes.string,
  isCollection: PropTypes.bool,
  renderMode: PropTypes.string,
  doFetchItemsInCollection: PropTypes.func,
};

export default EmbedWrapperPage;

function getUriFromMatch(match) {
  if (match) {
    const { claimName, claimId } = match.params || {};

    // Special case: don't resolve "home" as a claim (it has its own route)
    if (claimName === 'home' && !claimId) {
      return '';
    }

    // https://{DOMAIN}/claimName/claimId
    const isOldPermanentUriFormat =
      claimName && !claimName.startsWith('@') && !claimName.includes(':') && !claimName.includes('#') && claimId;

    // https://{DOMAIN}/channelName/claimName/
    // on match channelName = claimName / claimName = claimId
    const isCanonicalUriFormat = !isOldPermanentUriFormat;

    if (isOldPermanentUriFormat) {
      try {
        return buildURI({ claimName, claimId });
      } catch (error) {}
    }

    if (isCanonicalUriFormat && claimName) {
      return normalizeURI(claimName + '/' + (claimId || ''));
    }
  }

  return '';
}

function buildMatchWithHash(match, hash) {
  const matchedPath = Object.assign({}, match || {});

  // if a claim is using the hash canonical format ("lbry://@chanelName#channelClaimId/streamName#streamClaimId"
  // instead of "lbry://@chanelName:channelClaimId/streamName:streamClaimId")
  if (hash && hash.length > 0 && matchedPath.params) {
    // the hash is on the channel part of the uri
    if (hash.includes('/')) {
      const newClaimNameParam = matchedPath.params.claimName;
      const claimIdPart = hash.substring(0, hash.indexOf('/'));

      if (newClaimNameParam && !newClaimNameParam.includes(claimIdPart)) {
        matchedPath.params.claimName = newClaimNameParam + claimIdPart;
        matchedPath.params.claimId = hash.substring(hash.indexOf('/') + 1);
      }
    } else {
      // the hash is on the stream part of the uri, so it looks like
      // "lbry://@chanelName:channelClaimId/streamName#streamClaimId" instead of
      // "lbry://@chanelName:channelClaimId/streamName:streamClaimId"
      matchedPath.params.claimId = (matchedPath.params.claimId || '') + hash;
    }
  }

  return matchedPath;
}
