// @flow
import React from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import TruncatedText from 'component/common/truncated-text';
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
import './style.scss';

type Props = {
  uri: string,
  collectionId: string,
  // -- redux --
  collectionCount: number,
  collectionName: string,
  collectionType: ?string,
  isFetchingItems: boolean,
  isResolvingCollection: boolean,
  title?: string,
  channel: ?any,
  channelTitle?: String,
  hasClaim: boolean,
  firstCollectionItemUrl: ?string,
  collectionUpdatedAt: number,
  collectionCreatedAt: ?number,
  isBuiltin: boolean,
  thumbnail: ?string,
  isEmpty: boolean,
  thumbnailFromClaim: string,
  thumbnailFromSecondaryClaim: string,
};

function CollectionPreview(props: Props) {
  const {
    uri,
    collectionId,
    collectionName,
    collectionCount,
    isFetchingItems,
    isResolvingCollection,
    collectionType,
    hasClaim,
    firstCollectionItemUrl,
    channel,
    channelTitle,
    collectionUpdatedAt,
    collectionCreatedAt,
    isBuiltin,
    thumbnail,
    isEmpty,
    thumbnailFromClaim,
    thumbnailFromSecondaryClaim,
  } = props;

  const { push } = useHistory();
  let test = thumbnail || thumbnailFromSecondaryClaim || thumbnailFromClaim;
  test = 'https://thumbnails.odycdn.com/optimize/s:390:220/quality:85/plain/' + test;
  console.log('====================================');
  console.log('thumbnail: ', thumbnail);
  // console.log('ui: ', uri)
  console.log('thumbnailFromSecondaryClaim: ', thumbnailFromSecondaryClaim);
  console.log('thumbnailFromClaim: ', thumbnailFromClaim);

  if (isFetchingItems || isResolvingCollection) {
    return <ClaimPreviewLoading />;
  }

  const navigateUrl = `/$/${PAGES.PLAYLIST}/${collectionId}`;
  const firstItemPath = formatLbryUrlForWeb(firstCollectionItemUrl) || '/';
  const hidePlayAll = collectionType === COL_TYPES.FEATURED_CHANNELS || collectionType === COL_TYPES.CHANNELS;
  const usedCollectionName = getLocalizedNameForCollectionId(collectionId) || collectionName;

  function handleClick(e) {
    if (navigateUrl) {
      push(navigateUrl);
    }
  }

  const navLinkProps = {
    to: navigateUrl,
    onClick: (e) => e.stopPropagation(),
  };

  if (collectionId === COLLECTIONS_CONSTS.QUEUE_ID && isEmpty) return null;

  return (
    <li role="link" onClick={handleClick} className="playlist-preview__wrapper">
      <div className="claim-preview__background" style={{ backgroundImage: 'url(' + test + ')' }} />
      <div className="claim-preview__content">
        <div className="thumbnail">
          <NavLink {...navLinkProps}>
            <FileThumbnail
              uri={uri || firstCollectionItemUrl}
              secondaryUri={uri && !thumbnail ? firstCollectionItemUrl : null}
              thumbnail={thumbnail || null}
            >
              <CollectionItemCount collectionId={collectionId} />
              <CollectionPreviewOverlay collectionId={collectionId} />
            </FileThumbnail>
          </NavLink>
        </div>

        <div className="playlist-claim-preview__text">
          <div className="table-column__title">
            <NavLink {...navLinkProps}>
              <h2>
                {isBuiltin && <Icon icon={COLLECTIONS_CONSTS.PLAYLIST_ICONS[collectionId]} />}
                <TruncatedText text={usedCollectionName} lines={1} style={{ marginRight: 'var(--spacing-s)' }} />
              </h2>
            </NavLink>
          </div>
          {hasClaim && (
            <div className="playlist-channel">
              <UriIndicator focusable={false} uri={channel && channel.permanent_url} link showHiddenAsAnonymous>
                <ChannelThumbnail uri={channel && channel.permanent_url} xsmall checkMembership={false} />
                {channelTitle}
              </UriIndicator>
            </div>
          )}

          <div className="playlist-claim-preview__info">
            <div className="meta">
              {hasClaim ? <CollectionPublicIcon /> : <CollectionPrivateIcon />}

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

            <div className="table-column__action">
              {collectionCount > 0 && !hidePlayAll && (
                <Button
                  button="alt"
                  // label={__('Play All')}
                  icon={ICONS.PLAY}
                  onClick={() =>
                    push({
                      pathname: firstItemPath,
                      search: generateListSearchUrlParams(collectionId),
                      state: { forceAutoplay: true },
                    })
                  }
                />
              )}
            </div>
          </div>

          <CollectionMenuList collectionId={collectionId} />
        </div>
      </div>
    </li>
  );
}

export default CollectionPreview;
