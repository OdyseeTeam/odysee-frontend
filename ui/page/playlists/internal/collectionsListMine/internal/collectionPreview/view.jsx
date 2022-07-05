// @flow
import React from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import TruncatedText from 'component/common/truncated-text';
import CollectionItemCount from './internal/collection-item-count';
import CollectionPrivateIcon from './internal/collection-private-icon';
import CollectionPublicIcon from './internal/collection-public-icon';
import CollectionMenuList from 'component/collectionMenuList';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import FileThumbnail from 'component/fileThumbnail';
import ChannelThumbnail from 'component/channelThumbnail';
import UriIndicator from 'component/uriIndicator';
import DateTime from 'component/dateTime';
import { formatLbryUrlForWeb, generateListSearchUrlParams } from 'util/url';
import CollectionPreviewOverlay from 'component/collectionPreviewOverlay';
import Button from 'component/button';
import ClaimPreviewLoading from 'component/common/claim-preview-loading';
import I18nMessage from 'component/i18nMessage';
import Icon from 'component/common/icon';
import './style.scss';

type Props = {
  uri: string,
  collectionId: string,
  // -- redux --
  collectionCount: number,
  collectionName: string,
  collectionItemUrls: Array<string>,
  isResolvingCollectionClaims: boolean,
  isResolvingUri: boolean,
  title?: string,
  channel: ?any,
  hasClaim: boolean,
  firstCollectionItemUrl: ?string,
  collectionUpdatedAt: number,
  collectionCreatedAt: number,
  hasEdits: boolean,
  isBuiltin: boolean,
};

function CollectionPreview(props: Props) {
  const {
    uri,
    collectionId,
    collectionName,
    collectionCount,
    isResolvingUri,
    isResolvingCollectionClaims,
    collectionItemUrls,
    hasClaim,
    firstCollectionItemUrl,
    channel,
    collectionUpdatedAt,
    collectionCreatedAt,
    hasEdits,
    isBuiltin,
  } = props;

  const { push } = useHistory();

  if (isResolvingUri || isResolvingCollectionClaims) {
    return <ClaimPreviewLoading />;
  }

  const navigateUrl = `/$/${PAGES.PLAYLIST}/${collectionId}`;
  const firstItemPath = formatLbryUrlForWeb(collectionItemUrls[0] || '/');

  function handleClick(e) {
    if (navigateUrl) {
      push(navigateUrl);
    }
  }

  const navLinkProps = {
    to: navigateUrl,
    onClick: (e) => e.stopPropagation(),
  };

  return (
    <li
      role="link"
      onClick={handleClick}
      className="li--no-style claim-preview__wrapper playlist-claim-preview__wrapper"
    >
      <div className="table-column__thumbnail">
        <NavLink {...navLinkProps}>
          <FileThumbnail uri={uri || firstCollectionItemUrl} forcePlaceholder>
            <CollectionItemCount count={collectionCount} hasEdits={hasEdits} />
            <CollectionPreviewOverlay collectionId={collectionId} />
          </FileThumbnail>
        </NavLink>
      </div>

      <div className="table-column__title">
        <NavLink {...navLinkProps}>
          <h2>
            {isBuiltin && <Icon icon={COLLECTIONS_CONSTS.PLAYLIST_ICONS[collectionId]} />}
            <TruncatedText text={collectionName} lines={1} style={{ marginRight: 'var(--spacing-s)' }} />
          </h2>
        </NavLink>
        {hasClaim && (
          <div className="claim-preview__overlay-properties--small playlist-channel">
            <I18nMessage
              tokens={{
                playlist_channel: (
                  <UriIndicator focusable={false} uri={channel && channel.permanent_url} link showHiddenAsAnonymous>
                    <ChannelThumbnail uri={channel && channel.permanent_url} xsmall checkMembership={false} />
                  </UriIndicator>
                ),
              }}
            >
              Published as: %playlist_channel%
            </I18nMessage>
          </div>
        )}
      </div>

      <div className="table-column__visibility">
        <div className="claim-preview-info">{hasClaim ? <CollectionPublicIcon /> : <CollectionPrivateIcon />}</div>
      </div>

      <div className="table-column__create-at" uri={uri}>
        <DateTime timeAgo date={collectionCreatedAt} />
      </div>

      <div className="table-column__update-at" uri={uri}>
        <DateTime timeAgo date={collectionUpdatedAt} />
      </div>

      <div className="table-column__action">
        {collectionCount > 0 && (
          <Button
            button="alt"
            label={__('Play All')}
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

      <CollectionMenuList collectionId={collectionId} />
    </li>
  );
}

export default CollectionPreview;
