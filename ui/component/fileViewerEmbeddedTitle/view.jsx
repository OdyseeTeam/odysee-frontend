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
};

function FileViewerEmbeddedTitle(props: Props) {
  const { uri, isLivestreamClaim, title, preferEmbed, contentPosition } = props;

  const isEmbed = React.useContext(EmbedContext);

  const urlParams = new URLSearchParams();

  if (isEmbed) {
    urlParams.set('src', 'embed');
  }
  if (contentPosition && !isLivestreamClaim) {
    urlParams.set('t', String(contentPosition));
  }

  const contentLink = URL + formatLbryUrlForWeb(uri) + (urlParams.toString() ? `?${urlParams.toString()}` : '');

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
          navigate={URL}
          navigateTarget={isEmbed && '_blank'}
        >
          <Logo type={'embed'} />
        </Button>
      </div>
    </div>
  );
}

export default withRouter(FileViewerEmbeddedTitle);
