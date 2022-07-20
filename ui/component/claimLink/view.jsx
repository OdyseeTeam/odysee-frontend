// @flow
import { INLINE_PLAYER_WRAPPER_CLASS } from 'component/fileRenderFloating/view';
import * as React from 'react';
import Button from 'component/button';
import FileRenderInitiator from 'component/fileRenderInitiator';
import UriIndicator from 'component/uriIndicator';
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
      return (
        <div className="claim-link">
          <div className={isPlayingInline ? INLINE_PLAYER_WRAPPER_CLASS : 'embed__inline-wrapper'} id={claimLinkId}>
            <FileRenderInitiator
              uri={uri}
              parentCommentId={parentCommentId}
              isMarkdownPost={isMarkdownPost}
              embedded
              claimLinkId={claimLinkId}
            />
          </div>
          <Button button="link" className="preview-link__url" label={uri} navigate={uri} />
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
