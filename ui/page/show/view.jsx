// @flow
import { DOMAIN, ENABLE_NO_SOURCE_CLAIMS } from 'config';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import React, { useEffect } from 'react';
import { lazyImport } from 'util/lazyImport';
import { Redirect } from 'react-router-dom';
import Spinner from 'component/spinner';
import ChannelPage from 'page/channel';
import Page from 'component/page';
import Button from 'component/button';
import Card from 'component/common/card';
import Yrbl from 'component/yrbl';
import { formatLbryUrlForWeb } from 'util/url';
import { parseURI } from 'util/lbryURI';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { COL_TYPES } from 'constants/collections';
import * as MODALS from 'constants/modal_types';
import PAGES from 'constants/pages';

const AbandonedChannelPreview = lazyImport(() =>
  import('component/abandonedChannelPreview' /* webpackChunkName: "abandonedChannelPreview" */)
);
const FilePage = lazyImport(() => import('page/file' /* webpackChunkName: "filePage" */));
const LivestreamPage = lazyImport(() => import('page/livestream' /* webpackChunkName: "livestream" */));
const isDev = process.env.NODE_ENV !== 'production';

type Props = {
  isResolvingUri: boolean,
  isSubscribed: boolean,
  uri: string,
  claim: StreamClaim,
  channelClaimId: ?string,
  location: UrlLocation,
  blackListedOutpointMap: { [string]: number },
  filteredOutpointMap: { [string]: number },
  claimIsMine: boolean,
  claimIsPending: boolean,
  isLivestream: boolean,
  collectionId: string,
  collection: Collection,
  collectionUrls: Array<string>,
  isResolvingCollection: boolean,
  isAuthenticated: boolean,
  geoRestriction: ?GeoRestriction,
  homepageFetched: boolean,
  latestContentPath?: boolean,
  liveContentPath?: boolean,
  latestClaimUrl: ?string,
  creatorSettings: { [string]: PerChannelSettings },
  doFetchCreatorSettings: (channelId: string) => Promise<any>,
  fetchLatestClaimForChannel: (uri: string) => void,
  fetchChannelLiveStatus: (channelId: string) => void,
  doResolveUri: (uri: string, returnCached?: boolean, resolveReposts?: boolean, options?: any) => void,
  doBeginPublish: (name: ?string) => void,
  doFetchItemsInCollection: ({ collectionId: string }) => void,
  doOpenModal: (string, {}) => void,
};

export default function ShowPage(props: Props) {
  const {
    isResolvingUri,
    uri,
    claim,
    channelClaimId,
    blackListedOutpointMap,
    filteredOutpointMap,
    location,
    claimIsMine,
    isSubscribed,
    claimIsPending,
    isLivestream,
    collectionId,
    collection,
    collectionUrls,
    isResolvingCollection,
    isAuthenticated,
    geoRestriction,
    homepageFetched,
    latestContentPath,
    liveContentPath,
    latestClaimUrl,
    creatorSettings,
    doFetchCreatorSettings,
    fetchLatestClaimForChannel,
    fetchChannelLiveStatus,
    doResolveUri,
    doBeginPublish,
    doFetchItemsInCollection,
    doOpenModal,
  } = props;

  const { search, pathname, hash } = location;
  const urlParams = new URLSearchParams(search);
  const linkedCommentId = urlParams.get(LINKED_COMMENT_QUERY_PARAM);
  const threadCommentId = urlParams.get(THREAD_COMMENT_QUERY_PARAM);

  const signingChannel = claim && claim.signing_channel;
  const canonicalUrl = claim && claim.canonical_url;
  const claimExists = claim !== null && claim !== undefined;
  const haventFetchedYet = claim === undefined;
  const isMine = claim && claim.is_my_output;
  const claimId = claim && claim.claim_id;
  const isNewestPath = latestContentPath || liveContentPath;

  const { contentName, isChannel } = parseURI(uri); // deprecated contentName - use streamName and channelName
  const isCollection = claim && claim.value_type === 'collection';
  const resolvedCollection = collection && collection.id; // not null
  const showLiveStream = isLivestream && ENABLE_NO_SOURCE_CLAIMS;

  const channelOutpoint = signingChannel ? `${signingChannel.txid}:${signingChannel.nout}` : '';
  const claimOutpoint = claim ? `${claim.txid}:${claim.nout}` : '';

  const isClaimBlackListed = Boolean(blackListedOutpointMap[channelOutpoint] || blackListedOutpointMap[claimOutpoint]);
  const isClaimFiltered = Boolean(filteredOutpointMap[channelOutpoint] || filteredOutpointMap[claimOutpoint]);

  const shouldResolveUri =
    (doResolveUri && !isResolvingUri && uri && haventFetchedYet) ||
    (claimExists && !claimIsPending && (!canonicalUrl || (isMine === undefined && isAuthenticated)));

  useEffect(() => {
    if (!canonicalUrl && isNewestPath) {
      doResolveUri(uri);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only for mount on a latest content page
  }, []);

  useEffect(() => {
    if (!latestClaimUrl && liveContentPath && claimId) {
      fetchChannelLiveStatus(claimId);
    }
  }, [claimId, fetchChannelLiveStatus, latestClaimUrl, liveContentPath]);

  useEffect(() => {
    if (!latestClaimUrl && latestContentPath && canonicalUrl) {
      fetchLatestClaimForChannel(canonicalUrl);
    }
  }, [canonicalUrl, fetchLatestClaimForChannel, latestClaimUrl, latestContentPath]);

  // changed this from 'isCollection' to resolve strangers' collections.
  useEffect(() => {
    if (collectionId && !resolvedCollection) {
      doFetchItemsInCollection({ collectionId });
    }
  }, [isCollection, resolvedCollection, collectionId, doFetchItemsInCollection]);

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

  useEffect(() => {
    if (shouldResolveUri) {
      doResolveUri(
        uri,
        false,
        true,
        isMine === undefined && isAuthenticated ? { include_is_my_output: true, include_purchase_receipt: true } : {}
      );
    }
  }, [shouldResolveUri, doResolveUri, uri, isMine, isAuthenticated]);

  React.useEffect(() => {
    if (creatorSettings === undefined && channelClaimId) {
      doFetchCreatorSettings(channelClaimId);
    }
  }, [channelClaimId, creatorSettings, doFetchCreatorSettings]);

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

  let urlForCollectionZero;
  if (claim && isCollection && collectionUrls && collectionUrls.length) {
    switch (collection?.type) {
      case COL_TYPES.PLAYLIST:
        urlForCollectionZero = collectionUrls && collectionUrls[0];
        urlParams.set(COLLECTIONS_CONSTS.COLLECTION_ID, claim.claim_id);
        const newUrl = formatLbryUrlForWeb(`${urlForCollectionZero}?${urlParams.toString()}`);
        return <Redirect to={newUrl} />;

      case COL_TYPES.FEATURED_CHANNELS:
        return <Redirect to={`/$/${PAGES.PLAYLIST}/${claim.claim_id}`} />;

      default:
        // Do nothing
        break;
    }
  }

  if (!claim || !claim.name) {
    const maybeIsCategoryPage = pathname.startsWith('/$/');
    const waitingForCategory = maybeIsCategoryPage && !homepageFetched;

    return (
      <Page>
        {(haventFetchedYet ||
          shouldResolveUri || // covers the initial mount case where we haven't run doResolveUri, so 'isResolvingUri' is not true yet.
          isResolvingUri ||
          isResolvingCollection || // added for collection
          (isCollection && !urlForCollectionZero) || // added for collection - make sure we accept urls = []
          (creatorSettings === undefined && channelClaimId)) && (
          <div className="main--empty">
            <Spinner />
          </div>
        )}

        {!isResolvingUri && !isSubscribed && !shouldResolveUri && !waitingForCategory && (
          <div className="main--empty">
            <Yrbl
              title={isChannel ? __('Channel Not Found') : __('No Content Found')}
              subtitle={
                isChannel ? (
                  __(`Probably because you didn't make it.`)
                ) : (
                  <div className="section__actions">
                    <Button
                      button="primary"
                      label={__('Publish Something')}
                      onClick={() => doBeginPublish(contentName)}
                    />
                    <Button
                      button="secondary"
                      label={__('Repost Something')}
                      onClick={() => doOpenModal(MODALS.REPOST, { contentName })}
                    />
                  </div>
                )
              }
            />
          </div>
        )}

        {!isResolvingUri && isSubscribed && claim === null && (
          <React.Suspense fallback={null}>
            <AbandonedChannelPreview uri={uri} type="large" />
          </React.Suspense>
        )}
      </Page>
    );
  }

  if (geoRestriction && !claimIsMine) {
    return (
      <div className="main--empty">
        <Yrbl
          title={__(isChannel ? 'Channel unavailable' : 'Content unavailable')}
          subtitle={__(geoRestriction.message || '')}
          type="sad"
          alwaysShow
        />
      </div>
    );
  }

  if (claim.name.length && claim.name[0] === '@') {
    return <ChannelPage uri={uri} location={location} />;
  }

  if (isClaimBlackListed && !claimIsMine) {
    return (
      <Page className="custom-wrapper">
        <Card
          title={uri}
          subtitle={__(
            'In response to a complaint we received under the US Digital Millennium Copyright Act, we have blocked access to this content from our applications.'
          )}
          actions={
            <div className="section__actions">
              <Button button="link" href="https://odysee.com/@OdyseeHelp:b/copyright:f" label={__('Read More')} />
            </div>
          }
        />
      </Page>
    );
  }

  if (isClaimFiltered && !claimIsMine) {
    return (
      <Page className="custom-wrapper">
        <Card
          title={uri}
          subtitle={__('This content violates the terms and conditions of Odysee and has been filtered.')}
        />
      </Page>
    );
  }

  if (showLiveStream) {
    return (
      <React.Suspense fallback={null}>
        <LivestreamPage uri={uri} claim={claim} />
      </React.Suspense>
    );
  }

  return (
    <React.Suspense fallback={null}>
      <FilePage
        uri={uri}
        collectionId={collectionId}
        linkedCommentId={linkedCommentId}
        threadCommentId={threadCommentId}
      />
    </React.Suspense>
  );
}
