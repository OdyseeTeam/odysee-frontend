// @flow
import React from 'react';
import classnames from 'classnames';
import { NavLink, withRouter } from 'react-router-dom';
import { ChannelPageContext } from 'contexts/channel';
import ClaimPreviewProgress from 'component/claimPreviewProgress';
import FileThumbnail from 'component/fileThumbnail';
import UriIndicator from 'component/uriIndicator';
import TruncatedText from 'component/common/truncated-text';
import DateTime from 'component/dateTime';
import LivestreamDateTime from 'component/livestreamDateTime';
import ChannelThumbnail from 'component/channelThumbnail';
import FileViewCountInline from 'component/fileViewCountInline';
// import SubscribeButton from 'component/subscribeButton';
import useGetThumbnail from 'effects/use-get-thumbnail';
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
import { EmbedContext } from 'contexts/embed';
// $FlowFixMe cannot resolve ...
import PlaceholderTx from 'static/img/placeholderTx.gif';

type Props = {
  uri: string,
  date?: any,
  claim: ?Claim,
  mediaDuration?: string,
  isResolvingUri: boolean,
  claimIsMine: boolean,
  history: { push: (string) => void },
  title: string,
  placeholder: boolean,
  banState: { blacklisted?: boolean, filtered?: boolean, muted?: boolean, blocked?: boolean },
  geoRestriction: ?GeoRestriction,
  getFile: (string) => void,
  streamingUrl: string,
  isMature: boolean,
  showMature: boolean,
  showHiddenByUser?: boolean,
  showNoSourceClaims?: boolean,
  showUnresolvedClaims?: boolean,
  properties?: (Claim) => void,
  collectionId?: string,
  fypId?: string,
  isLivestream: boolean,
  viewCount: ?string,
  isLivestreamActive: boolean,
  swipeLayout: boolean,
  pulse?: boolean,
  firstCollectionItemUrl: ?string,
  onlyThumb?: boolean,
};

// preview image cards used in related video functionality, channel overview page and homepage
function ClaimPreviewTile(props: Props) {
  const {
    history,
    uri,
    date,
    isResolvingUri,
    claimIsMine,
    title,
    claim,
    placeholder,
    banState,
    geoRestriction,
    getFile,
    streamingUrl,
    isMature,
    showMature,
    showHiddenByUser,
    properties,
    showNoSourceClaims,
    showUnresolvedClaims,
    isLivestream,
    isLivestreamActive,
    collectionId,
    fypId,
    mediaDuration,
    viewCount,
    swipeLayout = false,
    pulse,
    firstCollectionItemUrl,
    onlyThumb,
  } = props;

  const isEmbed = React.useContext(EmbedContext);

  const isRepost = claim && claim.repost_channel_url;
  const isCollection = claim && claim.value_type === 'collection';
  const isStream = claim && claim.value_type === 'stream';
  const isAbandoned = !isResolvingUri && !claim;
  // $FlowFixMe
  const isPlayable =
    claim &&
    // $FlowFixMe
    claim.value &&
    // $FlowFixMe
    claim.value.stream_type &&
    // $FlowFixMe
    (claim.value.stream_type === 'audio' || claim.value.stream_type === 'video');
  const collectionClaimId = isCollection && claim && claim.claim_id;
  const thumbnailUrl = useGetThumbnail(uri, claim, streamingUrl, getFile, placeholder);
  const canonicalUrl = claim && claim.canonical_url;
  const repostedContentUri = claim && (claim.reposted_claim ? claim.reposted_claim.permanent_url : claim.permanent_url);
  const listId = collectionId || collectionClaimId;
  const navigateUrl =
    formatLbryUrlForWeb(canonicalUrl || uri || '/') +
    (listId ? generateListSearchUrlParams(listId) : '') +
    (fypId ? `?${FYP_ID}=${fypId}` : ''); // sigh...
  const navLinkProps = {
    to: navigateUrl,
    onClick: (e) => e.stopPropagation(),
  };

  const signingChannel = claim && claim.signing_channel;
  const isChannel = claim && claim.value_type === 'channel';
  const channelUri = !isChannel ? signingChannel && signingChannel.permanent_url : claim && claim.permanent_url;
  const channelTitle = signingChannel && ((signingChannel.value && signingChannel.value.title) || signingChannel.name);

  const isChannelPage = React.useContext(ChannelPageContext);
  const shouldShowViewCount = !(!viewCount || (claim && claim.repost_url) || isLivestream || !isChannelPage);

  const ariaLabelData = isChannel ? title : formatClaimPreviewTitle(title, channelTitle, date, mediaDuration);

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

  if (!shouldHide) {
    shouldHide = isLivestream && !showNoSourceClaims;
  }

  // **************************************************************************
  // **************************************************************************

  function handleClick(e) {
    if (navigateUrl && !isEmbed) {
      history.push(navigateUrl);
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
          'swipe-list__item claim-preview--horizontal-tile': swipeLayout,
          pulse: pulse,
        })}
      >
        <div className="media__thumb">
          <img src={PlaceholderTx} alt="Placeholder" />
        </div>
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
      className={classnames('card claim-preview--tile', {
        'claim-preview__wrapper--channel': isChannel,
        'claim-preview__live': isLivestreamActive,
        'swipe-list__item claim-preview--horizontal-tile': swipeLayout,
      })}
    >
      <NavLink {...navLinkProps} role="none" tabIndex={-1} aria-hidden target={isEmbed && '_blank'}>
        <FileThumbnail thumbnail={thumbnailUrl} allowGifs tileLayout uri={uri} secondaryUri={firstCollectionItemUrl}>
          {!isChannel && (
            <React.Fragment>
              {((fypId && isStream) || isPlayable) && (
                <div className="claim-preview__hover-actions-grid">
                  {fypId && isStream && (
                    <div className="claim-preview__hover-actions">
                      <FileHideRecommendation focusable={false} uri={repostedContentUri} />
                    </div>
                  )}

                  {isPlayable && (
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
      </NavLink>

      {/* TODO: change this after ClaimPreview/ClaimPreviewTile refactor
      onlyThumb used for the preview tile functionality, without the bottom part (channel, menu, etc) */}
      {!onlyThumb && (
        <>
          <div className="claim-tile__header">
            <NavLink aria-label={ariaLabelData} {...navLinkProps} target={isEmbed && '_blank'}>
              <h2 className="claim-tile__title">
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
              {isChannel ? (
                //  <div className="claim-tile__about--channel">
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
                      {!isLivestream && <DateTime timeAgo uri={uri} />}
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

export default withRouter(ClaimPreviewTile);
