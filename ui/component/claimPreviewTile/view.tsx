import React from 'react';
import classnames from 'classnames';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChannelPageContext } from 'contexts/channel';
import * as COLLECTIONS from 'constants/collections';
import * as SETTINGS from 'constants/settings';
import ClaimPreviewProgress from 'component/claimPreviewProgress';
import FileThumbnail from 'component/fileThumbnail';
import UriIndicator from 'component/uriIndicator';
import TruncatedText from 'component/common/truncated-text';
import DateTimeClaim from 'component/dateTimeClaim';
import LivestreamDateTime from 'component/livestreamDateTime';
import ChannelThumbnail from 'component/channelThumbnail';
import FileViewCountInline from 'component/fileViewCountInline';
// import SubscribeButton from 'component/subscribeButton';
import useGetThumbnail from 'effects/use-get-thumbnail';
import { isClaimAllowedForCollection } from 'util/collections';
import { formatLbryUrlForWeb, generateListSearchUrlParams } from 'util/url';
import { formatClaimPreviewTitle } from 'util/formatAriaLabel';
import PreviewOverlayProperties from 'component/previewOverlayProperties';
import FileHideRecommendation from 'component/fileHideRecommendation';
import FileWatchLaterLink from 'component/fileWatchLaterLink';
import ButtonAddToQueue from 'component/buttonAddToQueue';
import ClaimRepostAuthor from 'component/claimRepostAuthor';
import ClaimMenuList from 'component/claimMenuList';
import CollectionPreviewOverlay from 'component/collectionPreviewOverlay';
import { FYP_ID } from 'constants/urlParams';
import * as PAGES from 'constants/pages';
import { EmbedContext } from 'contexts/embed';
import { isClaimNsfw, isClaimShort, isStreamPlaceholderClaim } from 'util/claim';
import formatMediaDuration from 'util/formatMediaDuration';
import type { HomepageTitles } from 'util/buildHomepage';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectClaimForUri,
  selectIsUriResolving,
  selectTitleForUri,
  selectDateForUri,
  selectGeoRestrictionForUri,
  selectClaimIsMine,
  selectIsShortForUri,
} from 'redux/selectors/claims';
import { doFileGetForUri } from 'redux/actions/file';
import { selectViewCountForUri, selectBanStateForUri } from 'lbryinc';
import { selectStreamingUrlForUri } from 'redux/selectors/file_info';
import { selectIsActiveLivestreamForUri } from 'redux/selectors/livestream';
import { selectShowMatureContent, selectClientSetting } from 'redux/selectors/settings';
import { selectFirstItemUrlForCollection } from 'redux/selectors/collections';
type Props = {
  uri: string;
  placeholder: boolean;
  showHiddenByUser?: boolean;
  showNoSourceClaims?: boolean;
  showUnresolvedClaims?: boolean;
  properties?: (arg0: Claim) => void;
  collectionId?: string;
  fypId?: string;
  pulse?: boolean;
  onlyThumb?: boolean;
  onClickHandledByParent?: boolean;
  isShortFromChannelPage?: boolean;
  sectionTitle?: HomepageTitles;
};

// preview image cards used in related video functionality, channel overview page and homepage
function ClaimPreviewTile(props: Props) {
  const {
    uri,
    placeholder,
    showHiddenByUser,
    properties,
    showNoSourceClaims,
    showUnresolvedClaims,
    collectionId,
    fypId,
    pulse,
    onlyThumb,
    onClickHandledByParent,
    isShortFromChannelPage,
    sectionTitle,
  } = props;
  const dispatch = useAppDispatch();
  // -- redux selectors --
  const claim = useAppSelector((state) => (uri ? selectClaimForUri(state, uri) : undefined));
  const media = claim && claim.value && (claim.value.video || claim.value.audio);
  const mediaDuration = media && media.duration && formatMediaDuration(media.duration);
  const isLivestream = isStreamPlaceholderClaim(claim);
  const repostSrcUri = claim && claim.repost_url && claim.canonical_url;
  const isCollection = claim && claim.value_type === 'collection';
  const date = useAppSelector((state) => (uri ? selectDateForUri(state, uri) : undefined));
  const isResolvingUri = useAppSelector((state) => (uri ? selectIsUriResolving(state, uri) : false));
  const claimIsMine = useAppSelector((state) => (uri ? selectClaimIsMine(state, claim) : false));
  const title = useAppSelector((state) => (uri ? selectTitleForUri(state, uri) : ''));
  const banState = useAppSelector((state) => selectBanStateForUri(state, uri));
  const geoRestriction = useAppSelector((state) => selectGeoRestrictionForUri(state, uri));
  const streamingUrl = useAppSelector((state) =>
    repostSrcUri || uri ? selectStreamingUrlForUri(state, repostSrcUri || uri) : undefined
  );
  const showMature = useAppSelector(selectShowMatureContent);
  const isMature = claim ? isClaimNsfw(claim) : false;
  const isLivestreamActive = useAppSelector((state) =>
    isLivestream && uri ? selectIsActiveLivestreamForUri(state, uri) : false
  );
  const viewCount = useAppSelector((state) => selectViewCountForUri(state, uri));
  const disableShortsView = useAppSelector((state) => selectClientSetting(state, SETTINGS.DISABLE_SHORTS_VIEW));
  const firstCollectionItemUrl = useAppSelector((state) =>
    claim && isCollection ? selectFirstItemUrlForCollection(state, claim.claim_id) : undefined
  );
  const defaultCollectionAction = useAppSelector((state) =>
    selectClientSetting(state, SETTINGS.DEFAULT_COLLECTION_ACTION)
  );
  const isShort = useAppSelector((state) => selectIsShortForUri(state, uri));
  const getFile = React.useCallback((u: string) => dispatch(doFileGetForUri(u)), [dispatch]);
  const isEmbed = React.useContext(EmbedContext);
  const { search } = useLocation();
  const navigate = useNavigate();
  const isRepost = claim && claim.repost_channel_url;
  const isStream = claim && claim.value_type === 'stream';
  const isAbandoned = !isResolvingUri && !claim;
  const showCollectionContext = isClaimAllowedForCollection(claim);
  const collectionClaimId = isCollection && claim && claim.claim_id;
  const thumbnailUrl = useGetThumbnail(uri, claim, streamingUrl, getFile, placeholder);
  const canonicalUrl = claim && claim.canonical_url;
  const repostedContentUri = claim && (claim.reposted_claim ? claim.reposted_claim.permanent_url : claim.permanent_url);
  const listId = collectionId || collectionClaimId || '';
  const navigateUrl =
    isCollection && defaultCollectionAction === COLLECTIONS.DEFAULT_ACTION_VIEW
      ? `/$/${PAGES.PLAYLIST}/${listId}`
      : formatLbryUrlForWeb(canonicalUrl || uri || '/') +
        (listId ? generateListSearchUrlParams(listId) : '') +
        (claim && isClaimShort(claim) && !disableShortsView ? '?view=shorts' : '') +
        (fypId ? `${claim && isClaimShort(claim) ? '&' : '?'}${FYP_ID}=${fypId}` : '') +
        (isShort && isShortFromChannelPage && !disableShortsView
          ? `${(claim && isClaimShort(claim)) || fypId ? '&' : '?'}from=channel`
          : '');
  // sigh...
  const navLinkProps = {
    to: navigateUrl,
    onClick: (e) => {
      onClickHandledByParent ? e.preventDefault() : e.stopPropagation();
    },
  };
  const queryParams = new URLSearchParams(search);
  const signingChannel = claim && claim.signing_channel;
  const isChannel = claim && claim.value_type === 'channel';
  const channelUri = !isChannel ? signingChannel && signingChannel.permanent_url : claim && claim.permanent_url;
  const channelTitle = signingChannel && ((signingChannel.value && signingChannel.value.title) || signingChannel.name);
  const isChannelPage = React.useContext(ChannelPageContext);
  const shouldShowViewCount = !(!viewCount || (claim && claim.repost_url) || isLivestream || !isChannelPage);
  const ariaLabelData = isChannel ? title : formatClaimPreviewTitle(title, channelTitle, date, mediaDuration);
  const useShortsThumb = sectionTitle === 'Shorts' || queryParams.get('view') === 'shortsTab';
  let shouldHide = false;

  if (isMature && !showMature) {
    // Unfortunately needed until this is resolved
    // https://github.com/lbryio/lbry-sdk/issues/2785
    shouldHide = true;
  }

  if (!shouldHide && geoRestriction && !claimIsMine) {
    shouldHide = true;
  }

  if (!shouldHide && !placeholder) {
    shouldHide =
      banState.blacklisted ||
      banState.filtered ||
      (!showHiddenByUser && (banState.muted || banState.blocked)) ||
      (isAbandoned && !showUnresolvedClaims);
  }

  // Filter empty reposts
  if (!shouldHide) {
    shouldHide = claim?.value_type === 'repost';
  }

  if (!shouldHide) {
    shouldHide = isLivestream && !showNoSourceClaims;
  }

  // **************************************************************************
  // **************************************************************************
  function handleClick() {
    if (navigateUrl && !isEmbed) {
      navigate(navigateUrl);
    }
  }

  // **************************************************************************
  // **************************************************************************
  if (claim && shouldHide) {
    return null;
  }

  if (placeholder || claim === undefined) {
    return (
      <li
        className={classnames('placeholder claim-preview--tile', {
          pulse: pulse,
        })}
      >
        <div
          className={classnames('media__thumb', {
            media__thumb__short: useShortsThumb,
          })}
        />
        <div className="placeholder__wrapper">
          <div className="claim-tile__title" />
          <div className="claim-tile__title_b" />
          <div
            className={classnames('claim-tile__info', {
              contains_view_count: shouldShowViewCount,
            })}
          >
            <div className="channel-thumbnail" />
            <div className="claim-tile__about">
              <div className="button__content" />
              <div className="claim-tile__about--counts" />
            </div>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      onClick={handleClick}
      className={classnames('claim-preview__wrapper claim-preview--tile', {
        'claim-preview__wrapper--channel': isChannel,
        'claim-preview__wrapper--live': isLivestreamActive,
        'claim-preview__wrapper--short': isShort && sectionTitle === 'Shorts',
      })}
    >
      {/* Use div instead of NavLink to avoid invalid <a> nesting with hover action buttons */}
      <div
        role="link"
        tabIndex={-1}
        aria-hidden
        onClick={(e) => {
          if (onClickHandledByParent) {
            e.preventDefault();
          } else {
            e.stopPropagation();
            if (isEmbed) {
              window.open(navigateUrl, '_blank');
            } else {
              navigate(navigateUrl);
            }
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <FileThumbnail
          isShort={isShort}
          thumbnail={thumbnailUrl}
          allowGifs
          tileLayout
          uri={uri}
          secondaryUri={firstCollectionItemUrl}
        >
          {!isChannel && (
            <React.Fragment>
              {((fypId && isStream) || showCollectionContext) && (
                <div className="claim-preview__hover-actions-grid">
                  {fypId && isStream && (
                    <div className="claim-preview__hover-actions">
                      <FileHideRecommendation focusable={false} uri={repostedContentUri} />
                    </div>
                  )}

                  {showCollectionContext && (
                    <>
                      <FileWatchLaterLink focusable={false} uri={repostedContentUri} />
                      <ButtonAddToQueue focusable={false} uri={repostedContentUri} />
                    </>
                  )}
                </div>
              )}

              <div className="claim-preview__file-property-overlay">
                <PreviewOverlayProperties uri={uri} properties={properties} />
              </div>
              <ClaimPreviewProgress uri={uri} />
            </React.Fragment>
          )}
          {isCollection && <CollectionPreviewOverlay collectionId={listId} />}
        </FileThumbnail>
      </div>

      {/* TODO: change this after ClaimPreview/ClaimPreviewTile refactor
      onlyThumb used for the preview tile functionality, without the bottom part (channel, menu, etc) */}
      {!onlyThumb && (
        <>
          <div className="claim-tile__header">
            <NavLink aria-label={ariaLabelData} {...navLinkProps} target={isEmbed && '_blank'}>
              <h2 className="claim-preview__title">
                <TruncatedText text={title || (claim && claim.name)} lines={isChannel ? 1 : 2} />
                {isChannel && (
                  <div className="claim-tile__about">
                    <UriIndicator uri={uri} external={isEmbed} />
                  </div>
                )}
              </h2>
            </NavLink>
            <ClaimMenuList uri={uri} collectionId={listId} fypId={fypId} channelUri={channelUri} />
          </div>
          <div>
            <div
              className={classnames('claim-tile__info', {
                contains_view_count: shouldShowViewCount,
              })}
            >
              {isChannel ? ( //  <div className="claim-tile__about--channel">
                //    <SubscribeButton uri={repostedChannelUri || uri} />
                //  </div>
                <></>
              ) : (
                <React.Fragment>
                  <UriIndicator focusable={false} uri={uri} link hideAnonymous external={isEmbed}>
                    <ChannelThumbnail uri={channelUri} xsmall checkMembership={false} />
                  </UriIndicator>

                  <div className="claim-tile__about">
                    <UriIndicator uri={uri} link external={isEmbed} />
                    <div className="claim-tile__about--counts">
                      <FileViewCountInline uri={uri} />
                      {isLivestream && <LivestreamDateTime uri={uri} />}
                      {!isLivestream && <DateTimeClaim uri={uri} />}
                    </div>
                  </div>
                </React.Fragment>
              )}
            </div>
            {isRepost && (
              <div className="claim-tile__repost-author">
                <ClaimRepostAuthor uri={uri} />
              </div>
            )}
          </div>
        </>
      )}
    </li>
  );
}

export default React.memo(ClaimPreviewTile);
