// @flow
import React from 'react';
import Button from 'component/button';
import { formatLbryUrlForWeb } from 'util/url';
import { withRouter } from 'react-router';
import Logo from 'component/logo';

type Props = {
  uri: string,
  isLivestreamClaim: boolean,
  title: ?string,
  preferEmbed: boolean,
  contentPosition: number,
};

function FileViewerEmbeddedTitle(props: Props) {
  const { uri, isLivestreamClaim, title, preferEmbed, contentPosition } = props;

  const isInIframe = document.location.ancestorOrigins.length > 0;
  const urlParams = new URLSearchParams();

  if (isInIframe) {
    urlParams.set('src', 'embed');
  }
  if (contentPosition && !isLivestreamClaim) {
    urlParams.set('t', contentPosition);
  }

  const contentLink = formatLbryUrlForWeb(uri) + (urlParams.toString() ? `?${urlParams.toString()}` : '');

  const contentLinkProps = !isInIframe ? { navigate: contentLink } : { href: contentLink };
  const odyseeLinkProps = !isInIframe ? { navigate: '/' } : { href: '/' };

  return (
    <div className="file-viewer__embedded-header">
      <div className="file-viewer__embedded-gradient" />
      {preferEmbed ? (
        <div className="file-viewer__embedded-title ">
          <span dir="auto">{title}</span>
        </div>
      ) : (
        <Button
          label={title}
          aria-label={title}
          button="link"
          className="file-viewer__embedded-title"
          {...contentLinkProps}
        />
      )}

      <div className="file-viewer__embedded-info">
        <Button
          className="file-viewer__overlay-logo"
          disabled={preferEmbed}
          aria-label={__('Home')}
          {...odyseeLinkProps}
        >
          <Logo type={'embed'} />
        </Button>
      </div>
    </div>
  );
}

export default withRouter(FileViewerEmbeddedTitle);
