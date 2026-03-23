import React from 'react';
import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import CollectionItemCount from './internal/collectionItemCount';
import CollectionPrivateIcon from 'component/common/collection-private-icon';
import CollectionPublicIcon from './internal/collection-public-icon';
import CollectionMenuList from 'component/collectionMenuList';
import { COL_TYPES } from 'constants/collections';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import FileThumbnail from 'component/fileThumbnail';
import ChannelThumbnail from 'component/channelThumbnail';
import UriIndicator from 'component/uriIndicator';
import DateTime from 'component/dateTime';
import { formatLbryUrlForWeb, generateListSearchUrlParams } from 'util/url';
import { getLocalizedNameForCollectionId } from 'util/collections';
import CollectionPreviewOverlay from 'component/collectionPreviewOverlay';
import Button from 'component/button';
import ClaimPreviewLoading from 'component/common/claim-preview-loading';
import Icon from 'component/common/icon';
import Tooltip from 'component/common/tooltip';
import Spinner from 'component/spinner';
import AutoPublishCountdown from './internal/autoPublishCountdown';
import { useAppSelector } from 'redux/hooks';
import {
  selectIsResolvingForId,
  selectTitleForUri,
  selectClaimIdForUri,
  selectClaimForClaimId,
  selectThumbnailForUri,
  selectClaimIsPendingForId,
} from 'redux/selectors/claims';
import {
  selectCollectionTitleForId,
  selectCountForCollectionId,
  selectAreCollectionItemsFetchingForId,
  selectFirstItemUrlForCollection,
  selectFirstPlayableUrlForCollectionId,
  selectUpdatedAtForCollectionId,
  selectCreatedAtForCollectionId,
  selectIsCollectionBuiltInForId,
  selectThumbnailForCollectionId,
  selectCollectionIsEmptyForId,
  selectCollectionTypeForId,
  selectCollectionHasEditsForId,
  selectCollectionIsPublishingForId,
  selectCollectionPublishErrorForId,
  selectCollectionAutoPublishForId,
  selectCollectionAutoPublishScheduledAtForId,
} from 'redux/selectors/collections';
import { getChannelFromClaim } from 'util/claim';
type Props = {
  uri?: string;
  collectionId?: string;
};

function CollectionPreview(props: Props) {
  const { uri: propUri, collectionId: propCollectionId } = props;
  const claimIdFromUri = useAppSelector((state) => (propUri ? selectClaimIdForUri(state, propUri) : undefined));
  const collectionId = propCollectionId || claimIdFromUri || '';
  const claim = useAppSelector((state) => selectClaimForClaimId(state, collectionId));
  const channel = getChannelFromClaim(claim);
  const uri = propUri || (claim && (claim.canonical_url || claim.permanent_url)) || null;
  let channelTitle: string | null = null;
  if (channel) {
    const { value, name } = channel;
    if (value && value.title) {
      channelTitle = value.title;
    } else {
      channelTitle = name;
    }
  }
  const firstCollectionItemUrl = useAppSelector((state) => selectFirstItemUrlForCollection(state, collectionId));
  const firstPlayableCollectionItemUrl = useAppSelector((state) =>
    selectFirstPlayableUrlForCollectionId(state, collectionId)
  );
  const collectionCount = useAppSelector((state) => selectCountForCollectionId(state, collectionId));
  const collectionName = useAppSelector((state) => selectCollectionTitleForId(state, collectionId));
  const collectionType = useAppSelector((state) => selectCollectionTypeForId(state, collectionId));
  const isFetchingItems = useAppSelector((state) => selectAreCollectionItemsFetchingForId(state, collectionId));
  const isResolvingCollection = useAppSelector((state) => selectIsResolvingForId(state, collectionId));
  const claimIsPending = useAppSelector((state) => selectClaimIsPendingForId(state, collectionId));
  const title = useAppSelector((state) => (uri ? selectTitleForUri(state, uri) : undefined));
  const hasClaim = Boolean(claim);
  const collectionUpdatedAt = useAppSelector((state) => selectUpdatedAtForCollectionId(state, collectionId));
  const collectionCreatedAt = useAppSelector((state) => selectCreatedAtForCollectionId(state, collectionId));
  const isBuiltin = useAppSelector((state) => selectIsCollectionBuiltInForId(state, collectionId));
  const thumbnail = useAppSelector((state) => selectThumbnailForCollectionId(state, collectionId));
  const isEmpty = useAppSelector((state) => selectCollectionIsEmptyForId(state, collectionId));
  const thumbnailFromClaim = useAppSelector((state) => (uri ? selectThumbnailForUri(state, uri) : ''));
  const thumbnailFromSecondaryClaim = useAppSelector((state) =>
    firstCollectionItemUrl ? selectThumbnailForUri(state, firstCollectionItemUrl, true) : ''
  );
  const collectionHasEdits = useAppSelector((state) => selectCollectionHasEditsForId(state, collectionId));
  const isPublishing = useAppSelector((state) => selectCollectionIsPublishingForId(state, collectionId));
  const publishError = useAppSelector((state) => selectCollectionPublishErrorForId(state, collectionId));
  const autoPublish = useAppSelector((state) => selectCollectionAutoPublishForId(state, collectionId));
  const autoPublishScheduledAt = useAppSelector((state) =>
    selectCollectionAutoPublishScheduledAtForId(state, collectionId)
  );
  const navigate = useNavigate();
  if (collectionType === 'featuredChannels') return null;
  const previewThumbnail = thumbnail || thumbnailFromSecondaryClaim || thumbnailFromClaim;
  const optimizedPreviewThumbnail = previewThumbnail
    ? `https://thumbnails.odycdn.com/optimize/s:390:220/quality:85/plain/${previewThumbnail}`
    : null;

  if (isFetchingItems || isResolvingCollection) {
    return <ClaimPreviewLoading />;
  }

  const navigateUrl = `/$/${PAGES.PLAYLIST}/${collectionId}`;
  const firstItemPath = firstPlayableCollectionItemUrl ? formatLbryUrlForWeb(firstPlayableCollectionItemUrl) : '/';
  const hidePlayAll = collectionType === COL_TYPES.FEATURED_CHANNELS || collectionType === COL_TYPES.CHANNELS;
  const usedCollectionName = getLocalizedNameForCollectionId(collectionId) || collectionName;

  function handleClick(e) {
    if (navigateUrl) {
      navigate(navigateUrl);
    }
  }

  const navLinkProps = {
    to: navigateUrl,
    onClick: (e) => e.stopPropagation(),
  };
  if (collectionId === COLLECTIONS_CONSTS.QUEUE_ID && isEmpty) return null;
  return (
    <li role="link" onClick={handleClick} className="playlist-preview__wrapper">
      <CollectionMenuList collectionId={collectionId} />
      <div
        className="background"
        style={
          optimizedPreviewThumbnail
            ? {
                backgroundImage: `url(${optimizedPreviewThumbnail})`,
              }
            : undefined
        }
      />
      <div className="content">
        <div className="thumbnail">
          <NavLink {...navLinkProps}>
            <FileThumbnail
              uri={uri || firstCollectionItemUrl}
              secondaryUri={uri && !thumbnail ? firstCollectionItemUrl : null}
              thumbnail={previewThumbnail || null}
            >
              <CollectionPreviewOverlay collectionId={collectionId} />
            </FileThumbnail>
          </NavLink>
        </div>

        <div className="text">
          <div className="title">
            <NavLink {...navLinkProps}>
              <h2>
                {isBuiltin && <Icon icon={COLLECTIONS_CONSTS.PLAYLIST_ICONS[collectionId]} />}
                {usedCollectionName}
                {collectionHasEdits && <Icon icon={ICONS.PUBLISH} />}
                {claimIsPending && (
                  <Tooltip
                    title={__('Your publish is being confirmed and will be live soon')}
                    arrow={false}
                    enterDelay={100}
                  >
                    <div className="pending-change">
                      <Spinner />
                    </div>
                  </Tooltip>
                )}
                {isPublishing && (
                  <Tooltip title={__('Publishing playlist updates in the background')} arrow={false} enterDelay={100}>
                    <div className="pending-change">
                      <Spinner />
                    </div>
                  </Tooltip>
                )}
                {collectionHasEdits && publishError && (
                  <Tooltip
                    title={__('Last publish failed. Open playlist and retry publish.')}
                    arrow={false}
                    enterDelay={100}
                  >
                    <span>
                      <Icon icon={ICONS.WARNING} />
                    </span>
                  </Tooltip>
                )}
              </h2>
            </NavLink>
          </div>
          {hasClaim && (
            <div className="channel">
              <UriIndicator focusable={false} uri={channel && channel.permanent_url} link showHiddenAsAnonymous>
                <ChannelThumbnail uri={channel && channel.permanent_url} xsmall checkMembership={false} />
                <label>{channelTitle}</label>
              </UriIndicator>
            </div>
          )}

          <div className="info">
            <div className="meta">
              <CollectionItemCount collectionId={collectionId} />
              {hasClaim ? <CollectionPublicIcon /> : <CollectionPrivateIcon />}

              {autoPublish && (
                <div className="auto-publish-badge">
                  <Icon icon={ICONS.PUBLISH} />
                  <span>
                    {isPublishing ? (
                      __('Publishing...')
                    ) : autoPublishScheduledAt ? (
                      <AutoPublishCountdown scheduledAt={autoPublishScheduledAt} />
                    ) : collectionHasEdits ? (
                      __('Publish pending')
                    ) : (
                      __('Auto-publish')
                    )}
                  </span>
                </div>
              )}

              <div className="create-at">
                {collectionCreatedAt && (
                  <>
                    <Icon icon={ICONS.TIME} />
                    <DateTime timeAgo date={collectionCreatedAt} />
                  </>
                )}
              </div>

              <div className="update-at">
                <Icon icon={ICONS.EDIT} />
                <DateTime timeAgo date={collectionUpdatedAt} />
              </div>
            </div>

            <div className="action">
              {collectionCount > 0 && firstPlayableCollectionItemUrl && !hidePlayAll && (
                <Button
                  button="alt"
                  icon={ICONS.PLAY}
                  onClick={() =>
                    navigate({
                      pathname: firstItemPath,
                      search: generateListSearchUrlParams(collectionId),
                      state: {
                        forceAutoplay: true,
                      },
                    })
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

export default CollectionPreview;
