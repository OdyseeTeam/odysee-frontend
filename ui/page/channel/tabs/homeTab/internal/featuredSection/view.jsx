// @flow
import React from 'react';
import { NavLink } from 'react-router-dom';
import FileThumbnail from 'component/fileThumbnail';
// import FileDescription from 'component/fileDescription';
import MarkdownPreview from 'component/common/markdown-preview';
import ClaimMenuList from 'component/claimMenuList';
import ChannelThumbnail from 'component/channelThumbnail';
import ClaimPreviewSubtitle from 'component/claimPreviewSubtitle';
import { formatLbryUrlForWeb } from 'util/url';
import PreviewOverlayProperties from 'component/previewOverlayProperties';

import './style.scss';

type Props = {
  uri: string,
  section: any,
  description: string,
  // --- select ---
  claim: ChannelClaim,
};

function FeaturedSection(props: Props) {
  const { uri, claim, description } = props;

  const navigateUrl = formatLbryUrlForWeb(uri || '/');
  const navLinkProps = {
    to: navigateUrl,
    onClick: (e) => {
      if (e.target.className === 'button__label') {
        e.stopPropagation();
      }
      // e.preventDefault()
    },
  };

  if (!uri) {
    return null;
  }

  return claim ? (
    <NavLink {...navLinkProps} role="none" tabIndex={-1} aria-hidden>
      <div className="claim-preview claim-preview-featured">
        <FileThumbnail uri={uri}>
          <PreviewOverlayProperties uri={uri} small={false} xsmall={false} />
        </FileThumbnail>
        <div className="claim-preview__text">
          <ClaimMenuList uri={uri} />
          <div className="claim-preview-info">
            <span>{claim.value.title}</span>
          </div>
          <div className="claim-preview-author">
            <ChannelThumbnail uri={claim.signing_channel?.canonical_url} xsmall checkMembership={false} />
            <ClaimPreviewSubtitle uri={uri} type="inline" showAtSign={false} />
          </div>
          <div className="claim-preview-description" {...navLinkProps}>
            <MarkdownPreview className="markdown-preview--description" content={description} simpleLinks />
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
