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
  // channelClaimId: string,
  uri: string,
  section: any,
  description: string,
};

function FeaturedSection(props: Props) {
  const { uri, claim, description } = props;

  const navigateUrl = formatLbryUrlForWeb(uri || '/');
  const navLinkProps = {
    to: navigateUrl,
    onClick: (e) => {
      e.stopPropagation();
    },
  };

  return claim ? (
    <NavLink {...navLinkProps} role="none" tabIndex={-1} aria-hidden>
      <div className="claim-preview claim-preview-featured">
        <FileThumbnail thumbnail={claim.value.thumbnail.url} uri={uri}>
          <PreviewOverlayProperties
            uri={uri}
            small={false}
            xsmall={false}
            // properties={liveProperty}
          />
        </FileThumbnail>
        <div className="claim-preview__text">
          <ClaimMenuList uri={uri} />
          <div className="claim-preview-info">
            <span>{claim.value.title}</span>
          </div>
          <div className="claim-preview-author">
            <ChannelThumbnail uri={claim.signing_channel.canonical_url} xsmall checkMembership={false} />
            <ClaimPreviewSubtitle uri={uri} type="inline" showAtSign={false} />
          </div>
          <div className="claim-preview-description">
            <MarkdownPreview className="markdown-preview--description" content={description} simpleLinks />
          </div>
        </div>
      </div>
    </NavLink>
  ) : (
    <h1>Loading...</h1>
  );
}

export default FeaturedSection;
