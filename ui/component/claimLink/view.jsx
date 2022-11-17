// @flow
import { INLINE_PLAYER_WRAPPER_CLASS } from 'constants/player';
import * as React from 'react';
import * as RENDER_MODES from 'constants/file_render_modes';
import Button from 'component/button';
import VideoClaimInitiator from 'component/videoClaimInitiator';
import UriIndicator from 'component/uriIndicator';
import FileViewerEmbeddedTitle from 'component/fileViewerEmbeddedTitle';
import ClaimPreviewTile from 'component/claimPreviewTile';
import { v4 as uuid } from 'uuid';

type Props = {
  uri: string,
  fullUri: string,
  claim: StreamClaim,
  children: React.Node,
  description: ?string,
  isResolvingUri: boolean,
  doResolveUri: (string, boolean) => void,
  playingUri: PlayingUri,
  parentCommentId?: string,
  isMarkdownPost?: boolean,
  allowPreview: boolean,
  renderMode: string,
};

type State = {
  claimLinkId: string,
};

class ClaimLink extends React.Component<Props, State> {
  static defaultProps = {
    href: null,
    link: false,
    thumbnail: null,
    description: null,
    isResolvingUri: false,
    allowPreview: false,
  };

  constructor(props: Props) {
    super(props);

    // each claimLink in a page will have a unique id for identifying duplicates (same URI multiple times)
    this.state = {
      claimLinkId: uuid(),
    };
  }

  componentDidMount() {
    this.resolve(this.props);
  }

  componentDidUpdate() {
    this.resolve(this.props);
  }

  resolve = (props: Props) => {
    const { isResolvingUri, doResolveUri, claim, uri } = props;

    if (!isResolvingUri && claim === undefined && uri) {
      doResolveUri(uri, true);
    }
  };

  render() {
    const {
      uri,
      fullUri,
      claim,
      children,
      isResolvingUri,
      playingUri,
      parentCommentId,
      isMarkdownPost,
      allowPreview,
      renderMode,
    } = this.props;

    const claimLinkId = this.state.claimLinkId;
    const isUnresolved = (!isResolvingUri && !claim) || !claim;
    const isPlayingInline =
      playingUri.uri === uri &&
      playingUri.sourceId === claimLinkId &&
      ((playingUri.source === 'comment' && parentCommentId === playingUri.commentId) ||
        playingUri.source === 'markdown');

    if (isUnresolved) {
      return <span>{children}</span>;
    }

    const { value_type: valueType } = claim;
    const isChannel = valueType === 'channel';

    if (isChannel) {
      return (
        <>
          <UriIndicator uri={uri} link showAtSign />
          <span>{fullUri.length > uri.length ? fullUri.substring(uri.length, fullUri.length) : ''}</span>
        </>
      );
    }

    if (allowPreview) {
      // -- Floating Render Claims are able to be played inline from the claim link
      if (RENDER_MODES.FLOATING_MODES.includes(renderMode)) {
        return (
          <div className="claim-link">
            <div className={isPlayingInline ? INLINE_PLAYER_WRAPPER_CLASS : 'embed__inline-wrapper'} id={claimLinkId}>
              <FileViewerEmbeddedTitle uri={uri} />

              <VideoClaimInitiator
                uri={uri}
                parentCommentId={parentCommentId}
                isMarkdownPost={isMarkdownPost}
                embedded
                claimLinkId={claimLinkId}
              />
            </div>

            <div className="preview-link__url">
              <Button button="link" label={uri} navigate={uri} />
            </div>
          </div>
        );
      }

      return (
        <div className="claim-link">
          <FileViewerEmbeddedTitle uri={uri} />
          <ClaimPreviewTile uri={uri} onlyThumb />

          <div className="preview-link__url">
            <Button button="link" label={uri} navigate={uri} />
          </div>
        </div>
      );
    }

    return (
      <Button
        button="link"
        title={__("This channel isn't staking enough Credits for link previews.")}
        label={children}
        className="button--external-link"
        navigate={uri}
      />
    );
  }
}

export default ClaimLink;
