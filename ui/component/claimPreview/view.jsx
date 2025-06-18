// @flow
import type { Node } from 'react';
import React, { useEffect, forwardRef } from 'react';
import { NavLink, withRouter } from 'react-router-dom';
import { isEmpty } from 'util/object';
import { lazyImport } from 'util/lazyImport';
import classnames from 'classnames';
import { isURIValid } from 'util/lbryURI';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import * as PAGES from 'constants/pages';
import { COLLECTION_PAGE } from 'constants/urlParams';
import { isChannelClaim } from 'util/claim';
import { isClaimAllowedForCollection } from 'util/collections';
import { formatLbryUrlForWeb } from 'util/url';
import { formatClaimPreviewTitle } from 'util/formatAriaLabel';
import { getChannelSubCountStr } from 'util/formatMediaDuration';
import { toCompactNotation } from 'util/string';
import ClaimPreviewProgress from 'component/claimPreviewProgress';
import Icon from 'component/common/icon';
import Tooltip from 'component/common/tooltip';
import FileThumbnail from 'component/fileThumbnail';
import UriIndicator from 'component/uriIndicator';
import PreviewOverlayProperties from 'component/previewOverlayProperties';
import ClaimTags from 'component/claimTags';
import SubscribeButton from 'component/subscribeButton';
import JoinMembershipButton from 'component/joinMembershipButton';
import ChannelThumbnail from 'component/channelThumbnail';
import ClaimSupportButton from 'component/claimSupportButton';
import useGetThumbnail from 'effects/use-get-thumbnail';
import ClaimPreviewTitle from 'component/claimPreviewTitle';
import ClaimPreviewSubtitle from 'component/claimPreviewSubtitle';
import ClaimRepostAuthor from 'component/claimRepostAuthor';
import FileWatchLaterLink from 'component/fileWatchLaterLink';
import PublishPending from 'component/publish/shared/publishPending';
import ButtonAddToQueue from 'component/buttonAddToQueue';
import ClaimMenuList from 'component/claimMenuList';
import ClaimPreviewReset from 'component/claimPreviewReset';
import ClaimPreviewLoading from 'component/common/claim-preview-loading';
import ClaimPreviewHidden from './internal/claim-preview-no-mature';
import ClaimPreviewNoContent from './internal/claim-preview-no-content';
import { ENABLE_NO_SOURCE_CLAIMS } from 'config';
import CollectionEditButtons from 'component/collectionEditButtons';
import * as ICONS from 'constants/icons';
import { useIsMobile } from 'effects/use-screensize';
import { EmbedContext } from 'contexts/embed';
import CollectionPreviewOverlay from 'component/collectionPreviewOverlay';

const AbandonedChannelPreview = lazyImport(() =>
  import('component/abandonedChannelPreview' /* webpackChunkName: "abandonedChannelPreview" */)
);

// preview images used on the landing page and on the channel page
type Props = {
  uri: string,
  claim: ?Claim,
  active: boolean,
  obscureNsfw: boolean,
  showUserBlocked: boolean,
  claimIsMine: boolean,
  pending?: boolean,
  reflectingProgress?: any, // fxme
  resolveUri: (string) => void,
  isResolvingUri: boolean,
  history: { push: (string | any) => void, location: { pathname: string, search: string } },
  title: string,
  nsfw: boolean,
  placeholder: string,
  type: string,
  nonClickable?: boolean,
  banState: { blacklisted?: boolean, filtered?: boolean, muted?: boolean, blocked?: boolean },
  geoRestriction: ?GeoRestriction,
  hasVisitedUri: boolean,
  blockedUris: Array<string>,
  actions: boolean | Node | string | number,
  properties: boolean | Node | string | number | ((Claim) => Node),
  empty?: Node,
  onClick?: (e: any, claim?: ?Claim, index?: number) => any,
  streamingUrl: ?string,
  getFile: (string) => void,
  customShouldHide?: (Claim) => boolean,
  searchParams?: { [string]: string },
  showUnresolvedClaim?: boolean,
  showNullPlaceholder?: boolean,
  includeSupportAction?: boolean,
  hideActions?: boolean,
  hideJoin?: boolean,
  renderActions?: (Claim) => ?Node,
  wrapperElement?: string,
  hideRepostLabel?: boolean,
  repostUrl?: string,
  hideMenu?: boolean,
  isLivestream?: boolean,
  isLivestreamActive: boolean,
  collectionId?: string,
  isCollectionMine: boolean,
  disableNavigation?: boolean, // DEPRECATED - use 'nonClickable'. Remove this when channel-finder is consolidated (#810)
  mediaDuration?: string,
  date?: any,
  indexInContainer?: number, // The index order of this component within 'containerId'.
  channelSubCount?: number,
  lang: string,
  showEdit?: boolean,
  isEditPreview?: boolean,
  dragHandleProps?: any,
  unavailableUris?: Array<string>,
  inWatchHistory?: boolean,
  smallThumbnail?: boolean,
  showIndexes?: boolean,
  playItemsOnClick?: boolean,
  disableClickNavigation?: boolean,
  firstCollectionItemUrl: ?string,
  doClearContentHistoryUri: (uri: string) => void,
  doPlayNextUri: (params: { uri: string }) => void,
  doDisablePlayerDrag?: (disable: boolean) => void,
  thumbnailFromClaim: string,
  defaultCollectionAction: string,
};

const ClaimPreview = forwardRef<any, {}>((props: Props, ref: any) => {
  const {
    // core
    uri,
    claim,
    isResolvingUri,
    // core actions
    getFile,
    resolveUri,
    // claim properties
    // is the claim consider nsfw?
    nsfw,
    date,
    title,
    claimIsMine,
    streamingUrl,
    mediaDuration,
    // user properties
    hasVisitedUri,
    // component
    history,
    wrapperElement,
    type,
    nonClickable,
    placeholder,
    // pending
    reflectingProgress,
    pending,
    empty,
    // modifiers
    active,
    customShouldHide,
    searchParams,
    showNullPlaceholder,
    // value from show mature content user setting
    // true if the user doesn't wanna see nsfw content
    obscureNsfw,
    showUserBlocked,
    showUnresolvedClaim,
    hideRepostLabel = false,
    hideActions = false,
    properties,
    onClick,
    actions,
    banState,
    geoRestriction,
    includeSupportAction,
    renderActions,
    hideMenu = false,
    hideJoin = false,
    // repostUrl,
    isLivestream,
    isLivestreamActive,
    collectionId,
    isCollectionMine,
    disableNavigation,
    indexInContainer,
    channelSubCount,
    lang,
    showEdit,
    isEditPreview,
    dragHandleProps,
    unavailableUris,
    inWatchHistory,
    smallThumbnail,
    showIndexes,
    playItemsOnClick,
    disableClickNavigation,
    firstCollectionItemUrl,
    doClearContentHistoryUri,
    doPlayNextUri,
    doDisablePlayerDrag,
    thumbnailFromClaim,
    defaultCollectionAction,
  } = props;

  const isEmbed = React.useContext(EmbedContext);

  const isMobile = useIsMobile();

  const {
    location: { pathname, search },
  } = history;

  const urlParams = new URLSearchParams(search);
  const playlistPreviewItem = unavailableUris !== undefined || showIndexes;
  const isCollection = claim && claim.value_type === 'collection';
  const isCollectionOnPublicView = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.PUBLIC;
  const collectionClaimId = isCollection && claim && claim.claim_id;
  const listId = collectionId || collectionClaimId;
  const WrapperElement = wrapperElement || 'li';
  const shouldFetch =
    claim === undefined || (claim !== null && claim.value_type === 'channel' && isEmpty(claim.meta) && !pending);
  const abandoned = !isResolvingUri && !claim;
  const isMyCollection = listId && (isCollectionMine || listId.includes('-'));
  if (isMyCollection && claim === null && unavailableUris) unavailableUris.push(uri);

  const backgroundImage = thumbnailFromClaim
    ? 'https://thumbnails.odycdn.com/optimize/s:390:0/quality:85/plain/' + thumbnailFromClaim
    : undefined;

  const shouldHideActions = hideActions || isMyCollection || type === 'small' || type === 'tooltip';
  const channelSubscribers = React.useMemo(() => {
    if (channelSubCount === undefined) {
      return <span />;
    }
    const formattedSubCount = toCompactNotation(channelSubCount, lang, 10000);
    const formattedSubCountLocale = Number(channelSubCount).toLocaleString();
    return (
      <div className="media__subtitle">
        <Tooltip title={formattedSubCountLocale} followCursor placement="top">
          <span className="claim-preview__channel-sub-count">
            {getChannelSubCountStr(channelSubCount, formattedSubCount)}
          </span>
        </Tooltip>
      </div>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [channelSubCount]);

  // $FlowFixMe: claims not typed right
  const showCollectionContext = isClaimAllowedForCollection(claim);
  const isChannelUri = isChannelClaim(claim, uri);
  const signingChannel = claim && claim.signing_channel;
  const repostedChannelUri =
    claim && claim.repost_channel_url && claim.value_type === 'channel'
      ? claim.permanent_url || claim.canonical_url
      : undefined;
  const repostedContentUri = claim && (claim.reposted_claim ? claim.reposted_claim.permanent_url : claim.permanent_url);
  const isPublishSuggestion = placeholder === 'publish' && !claim && uri.startsWith('lbry://@'); // See commit a43d9150.

  // Get channel title ( use name as fallback )
  let channelTitle = null;
  if (signingChannel) {
    const { value, name } = signingChannel;
    if (value && value.title) {
      channelTitle = value.title;
    } else {
      channelTitle = name;
    }
  }

  const ariaLabelData = isChannelUri ? title : formatClaimPreviewTitle(title, channelTitle, date, mediaDuration);

  const navigateUrl =
    isCollection && listId && defaultCollectionAction === COLLECTIONS_CONSTS.DEFAULT_ACTION_VIEW
      ? `/$/${PAGES.PLAYLIST}/${listId}`
      : formatLbryUrlForWeb((claim && claim.canonical_url) || uri || '/');
  let navigateSearch = new URLSearchParams();
  if (!isCollection && listId) {
    navigateSearch.set(COLLECTIONS_CONSTS.COLLECTION_ID, listId);
  }
  if (searchParams) {
    Object.keys(searchParams).forEach((key) => {
      navigateSearch.set(key, searchParams[key]);
    });
  }

  const handleNavLinkClick = (e) => {
    if (playItemsOnClick && claim) {
      doPlayNextUri({ uri: claim?.canonical_url || uri });
    }

    if (onClick) {
      onClick(e, claim, indexInContainer); // not sure indexInContainer is used for anything.
    }
    e.stopPropagation();
  };

  const navLinkProps = {
    to: {
      pathname: disableClickNavigation ? pathname : navigateUrl,
      search: disableClickNavigation ? search : navigateSearch.toString() ? '?' + navigateSearch.toString() : '',
    },
    onClick: handleNavLinkClick,
    // if items play on click, don't play on auxClick
    onAuxClick: playItemsOnClick ? undefined : handleNavLinkClick,
  };

  let shouldHide =
    placeholder !== 'loading' &&
    ((abandoned && !showUnresolvedClaim) || (!claimIsMine && obscureNsfw && nsfw && !showUserBlocked));

  // This will be replaced once blocking is done at the wallet server level
  if (!shouldHide && !claimIsMine && (banState.blacklisted || banState.filtered)) {
    shouldHide = true;
  }

  // block stream claims
  if (!shouldHide && !showUserBlocked && (banState.muted || banState.blocked)) {
    shouldHide = true;
  }

  if (!shouldHide && isPublishSuggestion) {
    shouldHide = true;
  }

  if (!shouldHide && !claimIsMine && geoRestriction) {
    shouldHide = true;
  }

  if (!shouldHide && customShouldHide && claim) {
    if (customShouldHide(claim)) {
      shouldHide = true;
    }
  }

  // **************************************************************************
  // **************************************************************************

  // Weird placement warning
  // Make sure this happens after we figure out if this claim needs to be hidden
  const thumbnailUrl = useGetThumbnail(uri, claim, streamingUrl, getFile, shouldHide);

  function handleOnClick(e) {
    if (onClick) {
      onClick(e, claim, indexInContainer);
    }

    if (playItemsOnClick && claim) {
      return doPlayNextUri({ uri: claim?.canonical_url || uri });
    }

    if (claim && !pending && !disableNavigation && !disableClickNavigation && !isEmbed) {
      history.push({
        pathname: navigateUrl,
        search: navigateSearch.toString() ? '?' + navigateSearch.toString() : '',
      });
    }
  }

  function removeFromHistory(e, uri) {
    e.stopPropagation();
    doClearContentHistoryUri(uri);
  }

  useEffect(() => {
    if (!isResolvingUri && shouldFetch && uri) {
      if (isURIValid(uri, false)) {
        resolveUri(uri);
      }
    }
  }, [uri, isResolvingUri, shouldFetch, resolveUri]);

  const JoinButton = React.useMemo(
    () => () =>
      isChannelUri &&
      !claimIsMine &&
      !hideJoin &&
      (!banState.muted || showUserBlocked) && (
        <div className={'membership-button-wrapper' + (type ? ' ' + type : '')}>
          <JoinMembershipButton uri={uri}  />
        </div>
      ),
    [banState.muted, claimIsMine, hideJoin, isChannelUri, showUserBlocked, type, uri]
  );

  // **************************************************************************
  // **************************************************************************

  if (!playlistPreviewItem && ((shouldHide && !showNullPlaceholder) || (isLivestream && !ENABLE_NO_SOURCE_CLAIMS))) {
    return null;
  }

  if (claim && geoRestriction && !claimIsMine) {
    return null; // Ignore 'showNullPlaceholder'
  }

  if (placeholder === 'loading' || (uri && claim === undefined)) {
    return (
      <ClaimPreviewLoading
        isChannel={isChannelUri}
        type={type}
        WrapperElement={WrapperElement}
        xsmall={smallThumbnail}
      />
    );
  }

  if (claim && showNullPlaceholder && shouldHide && nsfw && obscureNsfw) {
    return (
      <ClaimPreviewHidden
        message={__('Mature content hidden by your preferences')}
        isChannel={isChannelUri}
        type={type}
      />
    );
  }

  if ((claim && showNullPlaceholder && shouldHide) || (!claim && playlistPreviewItem)) {
    return (
      <WrapperElement
        ref={ref}
        className={classnames('claim-preview__wrapper', {
          'claim-preview__wrapper--row': !type,
          'claim-preview__wrapper--inline': type === 'inline',
          'claim-preview__wrapper--playlist-row': type === 'small' && collectionId,
          'claim-preview__wrapper--active': active,
          'non-clickable': !playlistPreviewItem || nonClickable,
        })}
      >
        <ClaimPreviewHidden
          message={!claim && playlistPreviewItem ? __('Deleted content') : __('This content is hidden')}
          isChannel={isChannelUri}
          type={type}
          uri={uri}
          collectionId={!claim && playlistPreviewItem && collectionId ? collectionId : undefined}
        />
        {playlistPreviewItem && !hideMenu && <ClaimMenuList uri={uri} collectionId={collectionId} />}
      </WrapperElement>
    );
  }

  if (!claim && (showNullPlaceholder || empty)) {
    return empty || <ClaimPreviewNoContent isChannel={isChannelUri} type={type} />;
  }

  if (!shouldFetch && showUnresolvedClaim && !isResolvingUri && isChannelUri && claim === null) {
    return (
      <React.Suspense fallback={null}>
        <AbandonedChannelPreview uri={uri} type />
      </React.Suspense>
    );
  }

  if (isPublishSuggestion) {
    return null; // Ignore 'showNullPlaceholder'
  }

  return (
    <WrapperElement
      ref={ref}
      role="link"
      onClick={pending || type === 'inline' ? undefined : handleOnClick}
      className={classnames('claim-preview__wrapper', {
        'claim-preview__wrapper--row': !type,
        'claim-preview__wrapper--channel': isChannelUri && type !== 'inline',
        'claim-preview__wrapper--inline': type === 'inline',
        'claim-preview__wrapper--recommendation': type === 'small',
        'claim-preview__wrapper--playlist-row': type === 'small' && collectionId,
        'claim-preview__wrapper--live': isLivestreamActive,
        'claim-preview__wrapper--active': active,
        'non-clickable': nonClickable,
      })}
    >
      <>
        {!type && (
          <div
            className="claim-preview__background"
            style={
              backgroundImage && {
                backgroundImage: 'url(' + backgroundImage + ')',
              }
            }
          />
        )}

        <div
          className={classnames('claim-preview', {
            'claim-preview--small': type === 'small' || type === 'tooltip',
            'claim-preview--large': type === 'large',
            'claim-preview--inline': type === 'inline',
            'claim-preview--tooltip': type === 'tooltip',
            'claim-preview--channel': isChannelUri,
            'claim-preview--visited': !isChannelUri && !claimIsMine && hasVisitedUri,
            'claim-preview--pending': pending,
            'claim-preview--collection-editing': isMyCollection && showEdit,
          })}
        >
          {!hideRepostLabel && <ClaimRepostAuthor uri={uri} />}
          {showIndexes && (
            <span className="card__subtitle card__subtitle--small-no-margin claim-preview__list-index">
              {indexInContainer + 1}
            </span>
          )}

          {isMyCollection && showEdit && !isCollectionOnPublicView && (
            <CollectionEditButtons
              uri={uri}
              collectionId={listId}
              isEditPreview={isEditPreview}
              dragHandleProps={dragHandleProps}
              doDisablePlayerDrag={doDisablePlayerDrag}
            />
          )}

          {isChannelUri && claim ? (
            <UriIndicator focusable={false} uri={uri} link external={isEmbed}>
              <ChannelThumbnail uri={uri} small={type === 'inline'} checkMembership={false} />
            </UriIndicator>
          ) : (
            <>
              {!pending ? (
                <NavLink aria-hidden tabIndex={-1} {...navLinkProps} target={isEmbed && '_blank'}>
                  <FileThumbnail
                    thumbnail={thumbnailUrl}
                    small={smallThumbnail}
                    uri={uri}
                    secondaryUri={firstCollectionItemUrl}
                  >
                    {showCollectionContext && !smallThumbnail && (
                      <div className="claim-preview__hover-actions-grid">
                        <FileWatchLaterLink focusable={false} uri={repostedContentUri} />
                        <ButtonAddToQueue focusable={false} uri={repostedContentUri} />
                      </div>
                    )}
                    <div className="claim-preview__file-property-overlay">
                      <PreviewOverlayProperties uri={uri} small={type === 'small'} xsmall={smallThumbnail} />
                    </div>
                    {isCollection && <CollectionPreviewOverlay collectionId={listId} />}
                    <ClaimPreviewProgress uri={uri} />
                  </FileThumbnail>
                </NavLink>
              ) : (
                <>
                  <FileThumbnail thumbnail={thumbnailUrl} uri={uri}>
                    <div className="claim-preview__file-property-overlay">
                      <PreviewOverlayProperties uri={uri} small={type === 'small'} xsmall={smallThumbnail} pending />
                    </div>
                  </FileThumbnail>
                </>
              )}
            </>
          )}

          <div className="claim-preview__text">
            <div className="claim-preview-metadata">
              <div className="claim-preview-info">
                {pending ? (
                  <ClaimPreviewTitle uri={uri} />
                ) : (
                  <NavLink
                    aria-label={ariaLabelData}
                    aria-current={active ? 'page' : null}
                    {...navLinkProps}
                    target={isEmbed && '_blank'}
                  >
                    <ClaimPreviewTitle uri={uri} />
                  </NavLink>
                )}
                {banState.blacklisted && claimIsMine && (
                  <a
                    href="https://help.odysee.tv/category-uploading/dmca-content/#receiving-a-dmca-notice"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="dmca-info">{__('DMCA flagged')}</div>
                  </a>
                )}
                {(pending || !!reflectingProgress) && <PublishPending uri={uri} />}
              </div>
              <div className="claim-tile__info">
                {!isChannelUri && signingChannel && (
                  <div className="claim-preview__channel-staked">
                    <UriIndicator focusable={false} uri={uri} link hideAnonymous external={isEmbed}>
                      <ChannelThumbnail uri={signingChannel.permanent_url} xsmall checkMembership={false} />
                    </UriIndicator>
                  </div>
                )}
                <ClaimPreviewSubtitle uri={uri} type={type} showAtSign={isChannelUri} />
                {channelSubscribers}

                {type !== 'small' && (
                  <>
                    <div className="claim-preview__tags">
                      {claim && (
                        <React.Fragment>
                          {typeof properties === 'function'
                            ? properties(claim)
                            : properties !== undefined
                            ? properties
                            : !isMobile && <ClaimTags uri={uri} type={type} />}
                        </React.Fragment>
                      )}
                    </div>
                    {isChannelUri && renderActions && claim && renderActions(claim)}
                  </>
                )}
              </div>
              {(pending || !!reflectingProgress) && <PublishPending uri={uri} />}

              {!type && (
                <div className="description__wrapper">
                  <div className="description">{claim?.value?.description || __('No description available.')}</div>
                </div>
              )}
            </div>

            {type !== 'small' && (!pending || !type) && isChannelUri && (
              <div className="claim-preview__actions">
                {!hideJoin && <JoinButton uri={uri} />}
                {!pending && (
                  <>
                    {shouldHideActions || renderActions ? null : actions !== undefined ? (
                      actions
                    ) : (
                      <>
                        {isChannelUri && !claimIsMine && (!banState.muted || showUserBlocked) && (
                          <SubscribeButton
                            uri={repostedChannelUri || (uri.startsWith('lbry://') ? uri : `lbry://${uri}`)}
                          />
                        )}
                        {includeSupportAction && type && <ClaimSupportButton uri={uri} />}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        {inWatchHistory && (
          <div onClick={(e) => removeFromHistory(e, uri)} className="claim-preview__history-remove">
            <Icon icon={ICONS.REMOVE} />
          </div>
        )}
        {/* Todo: check isLivestreamActive once we have that data consistently everywhere. */}
        {claim && isLivestream && <ClaimPreviewReset uri={uri} />}

        {!hideMenu && <ClaimMenuList uri={uri} collectionId={listId} />}
      </>
    </WrapperElement>
  );
});

export default withRouter(ClaimPreview);
