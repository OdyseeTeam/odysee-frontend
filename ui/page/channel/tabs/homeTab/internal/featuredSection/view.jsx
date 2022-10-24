// @flow
import React from 'react';
// import ClaimList from 'component/claimList';
// import Button from 'component/button';
import { NavLink, withRouter } from 'react-router-dom';
import FileThumbnail from 'component/fileThumbnail';
// import FileDescription from 'component/fileDescription';
import MarkdownPreview from 'component/common/markdown-preview';
import ClaimMenuList from 'component/claimMenuList';
import ChannelThumbnail from 'component/channelThumbnail';
import ClaimPreviewTitle from 'component/claimPreviewTitle';
import ClaimPreviewSubtitle from 'component/claimPreviewSubtitle';
import { formatLbryUrlForWeb, generateListSearchUrlParams } from 'util/url';
import PreviewOverlayProperties from 'component/previewOverlayProperties';

import ClaimAuthor from 'component/claimAuthor';

import './style.scss';

type Props = {
  // channelClaimId: string,
  uri: string,
  section: any,
  description: string,
};

function FeaturedSection(props: Props) {
  const { uri, claim, description } = props;

  console.log('claim: ', claim);

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
        <ClaimMenuList uri={uri} />
        <FileThumbnail thumbnail={claim.value.thumbnail.url} uri={uri}>
          <PreviewOverlayProperties
            uri={uri}
            small={false}
            xsmall={false}
            // properties={liveProperty}
          />
        </FileThumbnail>
        <div className="claim-preview__text">
          <div className="claim-preview-info">
            <span>{claim.value.title}</span>
          </div>
          {/* <ClaimAuthor uri={uri} hideMenu hideActions /> */}
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
    <h1>load</h1>
  );
}

export default FeaturedSection;
