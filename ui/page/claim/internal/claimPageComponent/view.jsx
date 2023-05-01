// @flow
import { DOMAIN } from 'config';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import React, { useEffect } from 'react';
import { lazyImport } from 'util/lazyImport';
import { Redirect } from 'react-router-dom';
import Spinner from 'component/spinner';
import { formatLbryUrlForWeb } from 'util/url';
import { parseURI } from 'util/lbryURI';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { COL_TYPES } from 'constants/collections';
import PAGES from 'constants/pages';

const ChannelPage = lazyImport(() => import('./internal/channelPage' /* webpackChunkName: "channelPage" */));
const StreamClaimPage = lazyImport(() =>
  import('./internal/streamClaimPage' /* webpackChunkName: "streamClaimPage" */)
);
const isDev = process.env.NODE_ENV !== 'production';

type Props = {
  uri: string,
  latestContentPath?: boolean,
  liveContentPath?: boolean,
  // -- redux --
  claim: StreamClaim,
  channelClaimId: ?string,
  location: UrlLocation,
  collectionId: string,
  collection: Collection,
  collectionFirstItemUri: ?string,
  latestClaimUrl: ?string,
  creatorSettings: { [string]: PerChannelSettings },
  doFetchCreatorSettings: (channelId: string) => Promise<any>,
  doFetchLatestClaimForChannel: (uri: string) => void,
  doFetchChannelIsLiveForId: (channelId: string) => void,
  doFetchItemsInCollection: (params: { collectionId: string }) => void,
};

const ClaimPageComponent = (props: Props) => {
  const {
    uri,
    latestContentPath,
    liveContentPath,
    // -- redux --
    claim,
    channelClaimId,
    location,
    collectionId,
    collection,
    collectionFirstItemUri,
    latestClaimUrl,
    creatorSettings,
    doFetchCreatorSettings,
    doFetchLatestClaimForChannel,
    doFetchChannelIsLiveForId,
    doFetchItemsInCollection,
  } = props;

  const { search, pathname, hash } = location;
  const urlParams = new URLSearchParams(search);
  const linkedCommentId = urlParams.get(LINKED_COMMENT_QUERY_PARAM);
  const threadCommentId = urlParams.get(THREAD_COMMENT_QUERY_PARAM);

  const canonicalUrl = claim && claim.canonical_url;
  const claimId = claim && claim.claim_id;
  const isNewestPath = latestContentPath || liveContentPath;

  const isCollection = claim && claim.value_type === 'collection';

  const { isChannel } = parseURI(uri);

  useEffect(() => {
    if (!latestClaimUrl && liveContentPath && claimId) {
      doFetchChannelIsLiveForId(claimId);
    }
  }, [claimId, doFetchChannelIsLiveForId, latestClaimUrl, liveContentPath]);

  useEffect(() => {
    if (!latestClaimUrl && latestContentPath && canonicalUrl) {
      doFetchLatestClaimForChannel(canonicalUrl);
    }
  }, [canonicalUrl, doFetchLatestClaimForChannel, latestClaimUrl, latestContentPath]);

  useEffect(() => {
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
  }, [canonicalUrl, pathname, hash, search]);

  React.useEffect(() => {
    if (creatorSettings === undefined && channelClaimId) {
      doFetchCreatorSettings(channelClaimId).catch(() => {});
    }
  }, [channelClaimId, creatorSettings, doFetchCreatorSettings]);

  React.useEffect(() => {
    if (claim && collectionId) {
      doFetchItemsInCollection({ collectionId });
    }
  }, [claim, collectionFirstItemUri, collectionId, doFetchItemsInCollection, isCollection]);

  // Wait for latest claim fetch
  if (isNewestPath && latestClaimUrl === undefined) {
    return (
      <div className="main--empty">
        <Spinner delayed />
      </div>
    );
  }

  if (isNewestPath && latestClaimUrl) {
    const params = urlParams.toString() !== '' ? `?${urlParams.toString()}` : '';
    return <Redirect to={`${formatLbryUrlForWeb(latestClaimUrl)}${params}`} />;
  }

  // Don't navigate directly to repost urls
  // Always redirect to the actual content
  // Also redirect to channel page (uri) when on a non-existing latest path (live or content)
  if (claim && (claim.repost_url === uri || (isNewestPath && latestClaimUrl === null))) {
    const newUrl = formatLbryUrlForWeb(canonicalUrl);
    return <Redirect to={newUrl} />;
  }

  if (claim && isCollection && collectionFirstItemUri) {
    switch (collection?.type) {
      case COL_TYPES.COLLECTION:
      case COL_TYPES.PLAYLIST:
        urlParams.set(COLLECTIONS_CONSTS.COLLECTION_ID, claim.claim_id);
        const newUrl = formatLbryUrlForWeb(`${collectionFirstItemUri}?${urlParams.toString()}`);
        return <Redirect to={newUrl} />;

      case COL_TYPES.FEATURED_CHANNELS:
        return <Redirect to={`/$/${PAGES.PLAYLIST}/${claim.claim_id}`} />;

      default:
        // Do nothing
        break;
    }
  }

  if (isChannel) {
    return <ChannelPage uri={uri} location={location} />;
  }

  return (
    <StreamClaimPage
      uri={uri}
      collectionId={collectionId}
      linkedCommentId={linkedCommentId}
      threadCommentId={threadCommentId}
    />
  );
};

export default ClaimPageComponent;
