import { DOMAIN } from 'config';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import React, { useEffect } from 'react';
import { lazyImport } from 'util/lazyImport';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';

import Spinner from 'component/spinner';
import { formatLbryUrlForWeb } from 'util/url';
import { parseURI } from 'util/lbryURI';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { COL_TYPES } from 'constants/collections';
import PAGES from 'constants/pages';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectClaimForUri,
  selectIsUriResolving,
  selectClaimIsMine,
  makeSelectClaimIsPending,
  selectGeoRestrictionForUri,
  selectLatestClaimForUri,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import {
  selectCollectionForId,
  selectFirstItemUrlForCollection,
  selectAreCollectionItemsFetchingForId,
} from 'redux/selectors/collections';
import { selectHomepageFetched, selectUserVerifiedEmail } from 'redux/selectors/user';
import { doResolveUri, doResolveClaimId, doFetchLatestClaimForChannel } from 'redux/actions/claims';
import { doBeginPublish } from 'redux/actions/publish';
import { doOpenModal } from 'redux/actions/app';
import { getChannelIdFromClaim } from 'util/claim';
import { selectIsSubscribedForUri } from 'redux/selectors/subscriptions';
import { selectLatestLiveClaimForChannel, selectLatestLiveUriForChannel } from 'redux/selectors/livestream';
import { doFetchChannelIsLiveForId } from 'redux/actions/livestream';
import { doFetchCreatorSettings } from 'redux/actions/comments';
import { selectSettingsForChannelId } from 'redux/selectors/comments';
import { doFetchItemsInCollection } from 'redux/actions/collections';
import { PREFERENCE_EMBED } from 'constants/tags';
import withResolvedClaimRender from 'hocs/withResolvedClaimRender';
const ChannelPage = lazyImport(
  () =>
    import(
      './internal/channelPage'
      /* webpackChunkName: "channelPage" */
    )
);
const StreamClaimPage = lazyImport(
  () =>
    import(
      './internal/streamClaimPage'
      /* webpackChunkName: "streamClaimPage" */
    )
);
const isDev = process.env.NODE_ENV !== 'production';
type Props = {
  uri: string;
  latestContentPath?: boolean;
  liveContentPath?: boolean;
};

const ClaimPageComponent = (props: Props) => {
  const { uri, latestContentPath, liveContentPath } = props;
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { search, pathname, hash } = location;
  const urlParams = new URLSearchParams(search);
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const channelClaimId = getChannelIdFromClaim(claim);
  const { canonical_url: canonicalUrl, claim_id: claimId } = claim || {};
  const collectionId =
    urlParams.get(COLLECTIONS_CONSTS.COLLECTION_ID) ||
    (claim && claim.value_type === 'collection' && claim.claim_id) ||
    null;
  const latestContentClaim = useAppSelector((state) =>
    liveContentPath ? selectLatestLiveClaimForChannel(state, claimId) : selectLatestClaimForUri(state, canonicalUrl)
  );
  const latestLiveUri = useAppSelector((state) => selectLatestLiveUriForChannel(state, claimId));
  const latestClaimUrl = liveContentPath ? latestLiveUri : latestContentClaim && latestContentClaim.canonical_url;
  const collection = useAppSelector((state) => selectCollectionForId(state, collectionId));
  const collectionFirstItemUri = useAppSelector((state) => selectFirstItemUrlForCollection(state, collectionId));
  const creatorSettings = useAppSelector((state) => selectSettingsForChannelId(state, channelClaimId));
  const linkedCommentId = urlParams.get(LINKED_COMMENT_QUERY_PARAM);
  const threadCommentId = urlParams.get(THREAD_COMMENT_QUERY_PARAM);
  const isNewestPath = latestContentPath || liveContentPath;
  const isCollection = claim && claim.value_type === 'collection';
  const isEmbed = pathname && pathname.startsWith('/$/embed');
  // In embed mode with live/latest path, use the resolved URL instead of the channel URL
  const effectiveUri = isEmbed && isNewestPath && latestClaimUrl ? latestClaimUrl : uri;
  const { isChannel } = parseURI(effectiveUri);
  useEffect(() => {
    if (!latestClaimUrl && liveContentPath && claimId) {
      dispatch(doFetchChannelIsLiveForId(claimId));
    }
  }, [claimId, dispatch, latestClaimUrl, liveContentPath]);
  useEffect(() => {
    if (!latestClaimUrl && latestContentPath && canonicalUrl) {
      dispatch(doFetchLatestClaimForChannel(canonicalUrl));
    }
  }, [canonicalUrl, dispatch, latestClaimUrl, latestContentPath]);
  useEffect(() => {
    // Preserve /$/embed/... URLs; do not rewrite to canonical when embedded
    if (isEmbed) return;

    if (canonicalUrl) {
      const statePos =
        hash.indexOf('#state') > -1
          ? hash.indexOf('#state')
          : hash.indexOf('&state') > -1
            ? hash.indexOf('&state')
            : undefined;
      const pageHash = statePos === undefined ? hash : hash.substring(0, statePos);
      const urlPath = pathname + pageHash;
      const path = urlPath.slice(1).replace(/:/g, '#');
      // parseURI can parse queries and hashes when they are mixed with the uri
      let queryString, pathHash;

      try {
        ({ queryString, pathHash } = parseURI(path));
      } catch (e) {}

      const canonicalUrlPath = '/' + canonicalUrl.replace(/^lbry:\/\//, '').replace(/#/g, ':');
      // replaceState will fail if on a different domain (like webcache.googleusercontent.com)
      const hostname = isDev ? 'localhost' : DOMAIN;
      let replaceUrl = canonicalUrlPath;

      if (canonicalUrlPath !== urlPath && hostname === window.location.hostname) {
        const urlParams = new URLSearchParams(search || queryString);

        if (urlParams.get(COLLECTIONS_CONSTS.COLLECTION_ID)) {
          const listId = urlParams.get(COLLECTIONS_CONSTS.COLLECTION_ID) || '';
          urlParams.set(COLLECTIONS_CONSTS.COLLECTION_ID, listId);
        }

        if (urlParams.toString()) replaceUrl += `?${urlParams.toString()}`;
        if (pathHash || (!pathHash && !queryString && pageHash)) replaceUrl += String(pathHash || pageHash);
        history.replaceState(history.state, '', replaceUrl);
      }
    }
  }, [canonicalUrl, pathname, hash, search, isEmbed]);
  React.useEffect(() => {
    if (creatorSettings === undefined && channelClaimId) {
      dispatch(doFetchCreatorSettings(channelClaimId)).catch(() => {});
    }
  }, [channelClaimId, creatorSettings, dispatch]);
  React.useEffect(() => {
    if (claim && collectionId) {
      dispatch(
        doFetchItemsInCollection({
          collectionId,
        })
      );
    }
  }, [claim, collectionFirstItemUri, collectionId, dispatch, isCollection]);

  // Wait for latest claim fetch
  if (isNewestPath && latestClaimUrl === undefined) {
    return (
      <div className="main--empty">
        <Spinner delayed />
      </div>
    );
  }

  // Skip redirects in embed mode to preserve the embed URL
  if (!isEmbed) {
    if (isNewestPath && latestClaimUrl) {
      const params = urlParams.toString() !== '' ? `?${urlParams.toString()}` : '';
      return <Navigate replace to={`${formatLbryUrlForWeb(latestClaimUrl)}${params}`} />;
    }

    // Don't navigate directly to repost urls
    // Always redirect to the actual content
    // Also redirect to channel page (uri) when on a non-existing latest path (live or content)
    if (claim && (claim.repost_url === uri || (isNewestPath && latestClaimUrl === null))) {
      const newUrl = formatLbryUrlForWeb(canonicalUrl);
      return <Navigate replace to={newUrl} />;
    }

    if (claim && isCollection && collectionFirstItemUri) {
      switch (collection?.type) {
        case COL_TYPES.COLLECTION:
        case COL_TYPES.PLAYLIST: {
          urlParams.set(COLLECTIONS_CONSTS.COLLECTION_ID, claim.claim_id);
          const newUrl = formatLbryUrlForWeb(`${collectionFirstItemUri}?${urlParams.toString()}`);
          return <Navigate replace to={newUrl} />;
        }

        case COL_TYPES.FEATURED_CHANNELS:
          return <Navigate replace to={`/$/${PAGES.PLAYLIST}/${claim.claim_id}`} />;

        default:
          // Do nothing
          break;
      }
    }
  }

  if (isChannel) {
    return <ChannelPage uri={effectiveUri} location={location} />;
  }

  return (
    <StreamClaimPage
      uri={effectiveUri}
      collectionId={collectionId}
      linkedCommentId={linkedCommentId}
      threadCommentId={threadCommentId}
    />
  );
};

export default withResolvedClaimRender(ClaimPageComponent);
