// @flow
import React from 'react';
import Button from 'component/button';
import { URL } from 'config';
import { formatLbryUrlForWeb } from 'util/url';
import { withRouter } from 'react-router';
import { EmbedContext } from 'contexts/embed';
import Logo from 'component/logo';

type Props = {
  uri: string,
  isLivestreamClaim: boolean,
  title: ?string,
  preferEmbed: boolean,
  contentPosition: number,
  uriAccessKey: ?UriAccessKey,
};

function FileViewerEmbeddedTitle(props: Props) {
  const { uri, isLivestreamClaim, title, preferEmbed, contentPosition, uriAccessKey } = props;

  const isEmbed = React.useContext(EmbedContext);

  const urlParams = new URLSearchParams({
    ...(isEmbed ? { src: 'embed' } : {}),
    ...(contentPosition && !isLivestreamClaim ? { t: String(contentPosition) } : {}),
    ...(uriAccessKey ? { signature: uriAccessKey.signature, signature_ts: uriAccessKey.signature_ts } : {}),
  });

  const contentLink =
    (isEmbed ? URL : '') + formatLbryUrlForWeb(uri) + (urlParams.toString() ? `?${urlParams.toString()}` : '');

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
          navigate={contentLink}
          navigateTarget={isEmbed && '_blank'}
        />
      )}

      <div className="file-viewer__embedded-info">
        <Button
          className="file-viewer__overlay-logo"
          disabled={preferEmbed}
          aria-label={__('Home')}
          navigate={isEmbed ? URL : '/'}
          navigateTarget={isEmbed && '_blank'}
        >
          <Logo type={'embed'} />
        </Button>
      </div>
    </div>
  );
}

export default withRouter(FileViewerEmbeddedTitle);
