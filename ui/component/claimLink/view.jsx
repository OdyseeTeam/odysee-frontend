// @flow
import React from 'react';

import Button from 'component/button';
import UriIndicator from 'component/uriIndicator';
import ClaimLinkPreview from './internal/preview';

type Props = {
  uri: string,
  parentCommentId?: string,
  children: any,
  allowPreview: boolean,
  // -- redux --
  claim: StreamClaim,
  fullUri: string,
  isResolvingUri: boolean,
  doResolveUri: (string, boolean) => void,
};

const ClaimLink = (props: Props) => {
  const { uri, parentCommentId, children, allowPreview, claim, fullUri, isResolvingUri, doResolveUri } = props;

  React.useEffect(() => {
    if (claim === undefined && uri) {
      doResolveUri(uri, true);
    }
  }, [claim, doResolveUri, isResolvingUri, uri]);

  if (claim === undefined) {
    return <span>{children}</span>;
  }

  if (!claim) return null;

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
        <ClaimLinkPreview
          uri={uri}
          title={claim?.value?.title}
          channel={claim?.signing_channel?.value?.title || claim?.signing_channel?.name}
          parentCommentId={parentCommentId}
        />
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
};

export default ClaimLink;
