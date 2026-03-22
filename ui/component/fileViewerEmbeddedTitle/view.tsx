import React from 'react';
import Button from 'component/button';
import { URL } from 'config';
import { formatLbryUrlForWeb } from 'util/url';
import { EmbedContext } from 'contexts/embed';
import Logo from 'component/logo';
import { useAppSelector } from 'redux/hooks';
import { PREFERENCE_EMBED } from 'constants/tags';
import {
  makeSelectTagInClaimOrChannelForUri,
  selectTitleForUri,
  selectIsStreamPlaceholderForUri,
} from 'redux/selectors/claims';
import { selectContentPositionForUri, selectContentStates } from 'redux/selectors/content';
type Props = {
  uri: string;
  uriAccessKey?: UriAccessKey | null | undefined;
};

function FileViewerEmbeddedTitle(props: Props) {
  const { uri } = props;
  const title = useAppSelector((state) => selectTitleForUri(state, uri));
  const isLivestreamClaim = useAppSelector((state) => selectIsStreamPlaceholderForUri(state, uri));
  const contentPosition = useAppSelector((state) => selectContentPositionForUri(state, uri));
  const uriAccessKey = props.uriAccessKey || useAppSelector((state) => selectContentStates(state).uriAccessKeys[uri]);
  const preferEmbed = useAppSelector((state) => makeSelectTagInClaimOrChannelForUri(uri, PREFERENCE_EMBED)(state));
  const isEmbed = React.useContext(EmbedContext);
  const urlParams = new URLSearchParams({
    ...(isEmbed
      ? {
          src: 'embed',
        }
      : {}),
    ...(contentPosition && !isLivestreamClaim
      ? {
          t: String(contentPosition),
        }
      : {}),
    ...(uriAccessKey
      ? {
          signature: uriAccessKey.signature,
          signature_ts: uriAccessKey.signature_ts,
        }
      : {}),
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
export default FileViewerEmbeddedTitle;
