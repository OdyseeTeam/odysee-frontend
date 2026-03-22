import * as PAGES from 'constants/pages';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import React from 'react';
import classnames from 'classnames';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { lazyImport } from 'util/lazyImport';
import * as RENDER_MODES from 'constants/file_render_modes';
import { EmbedContext } from 'contexts/embed';
import Spinner from 'component/spinner';
import { buildURI, normalizeURI, parseURI } from 'util/lbryURI';
import { formatLbryUrlForWeb } from 'util/url';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectClaimForUri, selectIsUriResolving, selectLatestClaimForUri } from 'redux/selectors/claims';
import { getChannelIdFromClaim, isStreamPlaceholderClaim, getChannelFromClaim } from 'util/claim';
import { selectLatestLiveClaimForChannel, selectLatestLiveUriForChannel } from 'redux/selectors/livestream';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';
import { selectFirstItemUrlForCollection } from 'redux/selectors/collections';
import { doFetchItemsInCollection as doFetchItemsInCollectionAction } from 'redux/actions/collections';

const ClaimPage = lazyImport(
  () =>
    import(
      'page/claim'
      /* webpackChunkName: "claimPage" */
    )
);
const CollectionPage = lazyImport(
  () =>
    import(
      'page/collection'
      /* webpackChunkName: "collection" */
    )
);
const EmbedClaimComponent = lazyImport(
  () =>
    import(
      'page/embedWrapper/internal/embedClaimComponent'
      /* webpackChunkName: "embedClaimComponent" */
    )
);

const EmbedWrapperPage = () => {
  const dispatch = useAppDispatch();
  const [videoEnded, setVideoEnded] = React.useState(false);
  const { search, pathname, hash: locationHash } = useLocation();
  const params = useParams();
  const { claimName = '', claimId: routeClaimId = '' } = params;
  const match = React.useMemo(() => ({ params: { claimName, claimId: routeClaimId } }), [claimName, routeClaimId]);

  const urlParams = new URLSearchParams(search);
  const featureParam = urlParams.get('feature');
  const latestContentPath = featureParam === PAGES.LATEST;
  const liveContentPath = featureParam === PAGES.LIVE_NOW;
  const isPlaylistPath = pathname && pathname.includes('/playlist/');

  // Build URI from route match
  const matchedPath = buildMatchWithHash(match, locationHash);
  const matchUri = getUriFromMatch(matchedPath);

  // Resolve claim for the matched URI
  const matchedClaim = useAppSelector((state) => (matchUri ? selectClaimForUri(state, matchUri) : undefined));
  const canonicalUrl = matchedClaim?.canonical_url;
  const matchedClaimId = matchedClaim?.claim_id;
  const channelClaim = getChannelFromClaim(matchedClaim);
  const channelClaimId = getChannelIdFromClaim(matchedClaim);

  // Latest/live resolution
  const latestContentClaim = useAppSelector((state) =>
    featureParam === PAGES.LIVE_NOW
      ? selectLatestLiveClaimForChannel(state, channelClaimId)
      : selectLatestClaimForUri(state, canonicalUrl)
  );
  const latestClaimUrl = useAppSelector((state) =>
    featureParam === PAGES.LIVE_NOW
      ? selectLatestLiveUriForChannel(state, channelClaimId)
      : latestContentClaim?.canonical_url || null
  );

  // Determine final URI
  let uri: string;
  if (liveContentPath || latestContentPath) {
    uri = latestClaimUrl || matchUri;
  } else {
    uri = matchUri;
  }

  // Detect playlist collection
  let playlistCollectionId: string | null = null;
  const playlistMatch = pathname && pathname.match(/\/\$\/(?:embed\/)?playlist\/([a-f0-9]{40})/i);
  if (playlistMatch) {
    playlistCollectionId = playlistMatch[1];
  }

  let detectedCollectionId = playlistCollectionId;
  if (!detectedCollectionId && uri && typeof uri === 'string' && uri.toLowerCase().includes('/playlist')) {
    const collectionIdMatch = uri.match(/[#:/]([0-9a-f]{40})/i);
    if (collectionIdMatch) detectedCollectionId = collectionIdMatch[1];
  }

  const isCollection = (matchedClaim && matchedClaim.value_type === 'collection') || Boolean(detectedCollectionId);
  const collectionId =
    matchedClaim && matchedClaim.value_type === 'collection' ? matchedClaim.claim_id : detectedCollectionId;
  const collectionFirstItemUri = useAppSelector((state) =>
    collectionId ? selectFirstItemUrlForCollection(state, collectionId) : null
  );

  const renderMode = useAppSelector((state) => (uri ? makeSelectFileRenderModeForUri(uri)(state) : undefined));

  const embedLightBackground = urlParams.get('embedBackgroundLight');

  // Fetch collection items when we have a collectionId
  React.useEffect(() => {
    if (collectionId) {
      dispatch(doFetchItemsInCollectionAction({ collectionId }));
    }
  }, [collectionId, dispatch]);

  // For playlist URLs in embed mode, redirect to first item with lid parameter
  if (isPlaylistPath && collectionId && collectionFirstItemUri) {
    const firstItemPath = formatLbryUrlForWeb(collectionFirstItemUri);
    const redirectUrl = `/$/embed${firstItemPath}?${COLLECTIONS_CONSTS.COLLECTION_ID}=${collectionId}`;
    return <Navigate replace to={redirectUrl} />;
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
  const { isChannel } = uri
    ? parseURI(uri)
    : {
        isChannel: false,
      };
  const isMarkdown = renderMode === RENDER_MODES.MARKDOWN;
  const isPageLike = Boolean(isChannel || isCollection || isMarkdown);
  return (
    <EmbedContext.Provider
      value={{
        videoEnded,
        setVideoEnded,
      }}
    >
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

export default EmbedWrapperPage;

function getUriFromMatch(match: { params?: { claimName?: string; claimId?: string } }) {
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
        return buildURI({
          claimName,
          claimId,
        });
      } catch (error) {}
    }

    if (isCanonicalUriFormat && claimName) {
      return normalizeURI(claimName + '/' + (claimId || ''));
    }
  }

  return '';
}

function buildMatchWithHash(match: { params?: { claimName?: string; claimId?: string } }, hash: string | undefined) {
  const matchedPath: { params: { claimName?: string; claimId?: string } } = {
    params: { ...match?.params },
  };

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
