import React from 'react';
import { NavLink } from 'react-router-dom';
import './style.scss';
import FileThumbnail from 'component/fileThumbnail';
import ClaimMenuList from 'component/claimMenuList';
import ChannelThumbnail from 'component/channelThumbnail';
import ClaimPreviewSubtitle from 'component/claimPreviewSubtitle';
import FileWatchLaterLink from 'component/fileWatchLaterLink';
import ButtonAddToQueue from 'component/buttonAddToQueue';
import { isClaimAllowedForCollection } from 'util/collections';
import { formatLbryUrlForWeb } from 'util/url';
import PreviewOverlayProperties from 'component/previewOverlayProperties';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { getClaimMetadata } from 'util/claim';
import { selectClaimForUri, selectGeoRestrictionForUri } from 'redux/selectors/claims';
import { doResolveClaimId as doResolveClaimIdAction } from 'redux/actions/claims';
import { doFetchViewCount as doFetchViewCountAction } from 'lbryinc';
type Props = {
  uri: string;
  claimId: string;
  section: any;
};

function FeaturedSection(props: Props) {
  const { uri, claimId } = props;
  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const metadata = getClaimMetadata(claim);
  const description = metadata && metadata.description;
  const geoRestriction = Boolean(useAppSelector((state) => selectGeoRestrictionForUri(state, uri)));
  const doResolveClaimId = (id: string) => dispatch(doResolveClaimIdAction(id));
  const doFetchViewCount = (claimIdCsv: string) => dispatch(doFetchViewCountAction(claimIdCsv));
  const showCollectionContext = isClaimAllowedForCollection(claim);
  React.useEffect(() => {
    if (!uri && claimId) {
      doResolveClaimId(claimId);
      doFetchViewCount(claimId);
    }
  }, [uri, claimId, doResolveClaimId, doFetchViewCount]);

  if (geoRestriction) {
    return null;
  }

  const navigateUrl = formatLbryUrlForWeb(uri || '/');
  const navLinkProps = {
    to: navigateUrl,
    onClick: (e) => {
      if (e.target.className === 'button__label') {
        e.stopPropagation();
      }
    },
  };
  return claim ? (
    <NavLink {...navLinkProps} role="none" tabIndex={-1} aria-hidden>
      <div className="claim-preview claim-preview-featured">
        <FileThumbnail uri={uri} thumbnail={claim.value.thumbnail?.url} forceReload>
          {showCollectionContext && (
            <div className="claim-preview__hover-actions-grid">
              <FileWatchLaterLink focusable={false} uri={uri} />
              <ButtonAddToQueue focusable={false} uri={uri} />
            </div>
          )}
          <PreviewOverlayProperties uri={uri} small={false} xsmall={false} />
        </FileThumbnail>
        <div className="claim-preview__text">
          <ClaimMenuList uri={uri} />
          <div className="claim-preview-info">
            <div className="claim-preview__title">{claim.value.title}</div>
          </div>
          <div className="claim-preview-author">
            <ChannelThumbnail uri={claim.signing_channel?.canonical_url} xsmall checkMembership={false} />
            <ClaimPreviewSubtitle uri={uri} type="inline" showAtSign={false} />
          </div>
          <div className="claim-preview-description" {...navLinkProps}>
            <div className="markdown-preview--description">
              {description ? (description.length > 300 ? `${description.slice(0, 300)}...` : description) : ''}
            </div>
          </div>
        </div>
      </div>
    </NavLink>
  ) : (
    <div className="claim-preview claim-preview-featured claim-preview-featured-placeholder">
      <div className="media__thumb" />
      <div className="claim-preview__text">
        <div className="claim-preview-info">
          <span />
        </div>
        <div className="claim-preview-author">
          <div className="channel-thumbnail--xsmall" />
          <div className="media__subtitle" />
        </div>
        <div className="claim-preview-description">
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
      </div>
    </div>
  );
}

export default FeaturedSection;
