// @flow
import * as PAGES from 'constants/pages';
import React from 'react';
import classnames from 'classnames';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { lazyImport } from 'util/lazyImport';
import * as RENDER_MODES from 'constants/file_render_modes';
import { EmbedContext } from 'contexts/embed';
import Spinner from 'component/spinner';
import { buildURI, normalizeURI, parseURI } from 'util/lbryURI';
const ClaimPage = lazyImport(() => import('page/claim' /* webpackChunkName: "claimPage" */));
const CollectionPage = lazyImport(() => import('page/collection' /* webpackChunkName: "collection" */));
const EmbedClaimComponent = lazyImport(() =>
  import('page/embedWrapper/internal/embedClaimComponent' /* webpackChunkName: "embedClaimComponent" */)
);

// Keep uri derivation logic here and delegate full rendering to existing pages

type Props = {
  uri?: string,
  collectionId?: string,
  isCollection?: boolean,
  renderMode?: string,
};

const EmbedWrapperPage = (props: Props) => {
  const [videoEnded, setVideoEnded] = React.useState(false);
  const { uri: incomingUri, collectionId, isCollection, renderMode } = props;

  const {
    location: { search },
    match,
  } = useHistory();

  const matchedPath = buildMatchWithHash(match, window?.location?.hash);
  let uri = getUriFromMatch(matchedPath);
  if (!uri) uri = incomingUri;

  const urlParams = new URLSearchParams(search);
  const featureParam = urlParams.get('feature');
  const latestContentPath = featureParam === PAGES.LATEST;
  const liveContentPath = featureParam === PAGES.LIVE_NOW;
  const embedLightBackground = urlParams.get('embedBackgroundLight');

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
          {collectionId ? (
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
  isCollection: PropTypes.bool,
  renderMode: PropTypes.string,
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
