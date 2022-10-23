// @flow
import React from 'react';
import ClaimList from 'component/claimList';
import Button from 'component/button';
import { NavLink, withRouter } from 'react-router-dom';
import FileThumbnail from 'component/fileThumbnail';
import FileDescription from 'component/fileDescription';
import { formatLbryUrlForWeb, generateListSearchUrlParams } from 'util/url';

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
    onClick: (e) => e.stopPropagation(),
  };

  const isMobile = false;
  const livestream = false;
  const subCount = 0;
  return claim ? (
    <NavLink {...navLinkProps} role="none" tabIndex={-1} aria-hidden>
      <div className="claim-preview claim-preview-featured">
        <FileThumbnail thumbnail={claim.value.thumbnail.url} uri={uri} />
        <div className="claim-preview__text">
          <div className="claim-preview-info">{claim.value.title}</div>
          <FileDescription expandOverride={isMobile && livestream} allowMore={false} uri={uri} />
        </div>
      </div>
    </NavLink>
  ) : (
    <h1>load</h1>
  );
}

export default FeaturedSection;
