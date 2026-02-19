// @flow
import { DOMAIN } from 'config';
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import React, { useEffect } from 'react';
import { lazyImport } from 'util/lazyImport';
import { Redirect } from 'react-router-dom';
import Spinner from 'component/spinner';
import { formatLbryUrlForWeb } from 'util/url';
import { parseURI } from 'util/lbryURI';
import { buildWooClaimIdFromYtId, getWooType, parseWooTimestampToSeconds } from 'util/woo';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { COL_TYPES } from 'constants/collections';
import PAGES from 'constants/pages';

const ChannelPage = lazyImport(() => import('./internal/channelPage' /* webpackChunkName: "channelPage" */));
const StreamClaimPage = lazyImport(() =>
  import('./internal/streamClaimPage' /* webpackChunkName: "streamClaimPage" */)
);
const isDev = process.env.NODE_ENV !== 'production';

type WooOEmbed = {
  title: string,
  author_name: string,
  author_url: string,
  html: string,
  provider_name: string,
  thumbnail_url?: string,
};

type Props = {
  uri: string,
  wooYtId?: ?string,
  isWooContent?: boolean,
  latestContentPath?: boolean,
  liveContentPath?: boolean,
  // -- redux --
  claim: ?StreamClaim,
  channelClaimId: ?string,
  location: UrlLocation,
  collectionId: ?string,
  collection: ?Collection,
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
    wooYtId,
    isWooContent = false,
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
  const wooType = getWooType(urlParams.get('type'));
  const wooTimestamp = parseWooTimestampToSeconds(urlParams.get('t'));
  const wooClaimId = wooYtId ? buildWooClaimIdFromYtId(wooYtId) : undefined;
  const [wooResolveChecked, setWooResolveChecked] = React.useState(!isWooContent);
  const [wooResolvedWebPath, setWooResolvedWebPath] = React.useState<?string>(null);
  const [wooData, setWooData] = React.useState<?WooOEmbed>(null);
  const [wooDataLoading, setWooDataLoading] = React.useState(Boolean(isWooContent));
  const [wooDataError, setWooDataError] = React.useState<?string>(null);

  const canonicalUrl = claim && claim.canonical_url;
  const claimId = claim && claim.claim_id;
  const isNewestPath = latestContentPath || liveContentPath;

  const isCollection = claim && claim.value_type === 'collection';
  const isEmbed = pathname && pathname.startsWith('/$/embed');

  // In embed mode with live/latest path, use the resolved URL instead of the channel URL
  const effectiveUri = isEmbed && isNewestPath && latestClaimUrl ? latestClaimUrl : uri;
  const { isChannel } = parseURI(effectiveUri);

  useEffect(() => {
    if (!isWooContent || !wooYtId) return;

    let cancelled = false;
    const controller = new AbortController();

    setWooResolveChecked(false);
    setWooResolvedWebPath(null);
    setWooData(null);
    setWooDataError(null);
    setWooDataLoading(true);

    fetch(`https://api.odysee.com/yt/resolve?video_ids=${encodeURIComponent(wooYtId)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;

        const resolved = json?.data?.videos?.[wooYtId];
        if (resolved) {
          setWooResolvedWebPath(formatLbryUrlForWeb(`lbry://${resolved}`));
        }

        setWooResolveChecked(true);
      })
      .catch(() => {
        if (!cancelled) {
          setWooResolveChecked(true);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isWooContent, wooYtId]);

  useEffect(() => {
    if (!isWooContent || !wooYtId || !wooResolveChecked || wooResolvedWebPath) return;

    const controller = new AbortController();
    setWooData(null);
    setWooDataError(null);
    setWooDataLoading(true);

    const watchUrl = new URL('https://www.youtube.com/watch');
    watchUrl.searchParams.set('v', wooYtId);
    if (wooTimestamp !== null && wooTimestamp !== undefined) {
      watchUrl.searchParams.set('t', String(wooTimestamp));
    }

    const oEmbedUrl = new URL('https://www.youtube.com/oembed');
    oEmbedUrl.searchParams.set('url', watchUrl.toString());
    oEmbedUrl.searchParams.set('format', 'json');

    fetch(oEmbedUrl.toString(), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch oEmbed (${res.status})`);
        return res.json();
      })
      .then((json) => {
        setWooData(json);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setWooDataError(err.message || 'Failed to load');
        }
      })
      .finally(() => setWooDataLoading(false));

    return () => controller.abort();
  }, [isWooContent, wooResolveChecked, wooResolvedWebPath, wooTimestamp, wooYtId]);

  useEffect(() => {
    if (isWooContent) return;

    if (!latestClaimUrl && liveContentPath && claimId) {
      doFetchChannelIsLiveForId(claimId);
    }
  }, [claimId, doFetchChannelIsLiveForId, isWooContent, latestClaimUrl, liveContentPath]);

  useEffect(() => {
    if (isWooContent) return;

    if (!latestClaimUrl && latestContentPath && canonicalUrl) {
      doFetchLatestClaimForChannel(canonicalUrl);
    }
  }, [canonicalUrl, doFetchLatestClaimForChannel, isWooContent, latestClaimUrl, latestContentPath]);

  useEffect(() => {
    if (isWooContent) return;

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
  }, [canonicalUrl, pathname, hash, search, isEmbed, isWooContent]);

  React.useEffect(() => {
    if (isWooContent) return;

    if (creatorSettings === undefined && channelClaimId) {
      doFetchCreatorSettings(channelClaimId).catch(() => {});
    }
  }, [channelClaimId, creatorSettings, doFetchCreatorSettings, isWooContent]);

  React.useEffect(() => {
    if (isWooContent) return;

    if (claim && collectionId) {
      doFetchItemsInCollection({ collectionId });
    }
  }, [claim, collectionFirstItemUri, collectionId, doFetchItemsInCollection, isCollection, isWooContent]);

  if (isWooContent && !wooResolveChecked) {
    return (
      <div className="main--empty">
        <Spinner delayed />
      </div>
    );
  }

  if (isWooContent && wooResolvedWebPath) {
    const params = urlParams.toString() !== '' ? `?${urlParams.toString()}` : '';
    const pageHash = hash || '';
    return <Redirect to={`${wooResolvedWebPath}${params}${pageHash}`} />;
  }

  // Wait for latest claim fetch
  if (!isWooContent && isNewestPath && latestClaimUrl === undefined) {
    return (
      <div className="main--empty">
        <Spinner delayed />
      </div>
    );
  }

  // Skip redirects in embed mode to preserve the embed URL
  if (!isEmbed && !isWooContent) {
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
        case COL_TYPES.PLAYLIST: {
          urlParams.set(COLLECTIONS_CONSTS.COLLECTION_ID, claim.claim_id);
          const newUrl = formatLbryUrlForWeb(`${collectionFirstItemUri}?${urlParams.toString()}`);
          return <Redirect to={newUrl} />;
        }
        case COL_TYPES.FEATURED_CHANNELS:
          return <Redirect to={`/$/${PAGES.PLAYLIST}/${claim.claim_id}`} />;

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
      isWooContent={isWooContent}
      wooYtId={wooYtId}
      wooClaimId={wooClaimId}
      wooType={wooType}
      wooTimestamp={wooTimestamp}
      wooData={wooData}
      wooLoading={isWooContent && wooDataLoading}
      wooError={wooDataError}
    />
  );
};

export default ClaimPageComponent;
