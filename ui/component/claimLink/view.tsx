import React from 'react';
import Button from 'component/button';
import UriIndicator from 'component/uriIndicator';
import ClaimLinkPreview from './internal/preview';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { punctuationMarks } from 'util/remark-lbry';
import { selectClaimForUri, selectIsUriResolving } from 'redux/selectors/claims';
import { doResolveUri as doResolveUriAction } from 'redux/actions/claims';
type Props = {
  uri: string;
  parentCommentId?: string;
  children: any;
  allowPreview: boolean;
};

const ClaimLink = (props: Props) => {
  const { uri: inputUri, parentCommentId, children, allowPreview } = props;
  const dispatch = useAppDispatch();
  // Resolve valid URI stripping trailing punctuation if claim not found
  const { resolvedUri, claim } = useAppSelector((state) => {
    let testUri = inputUri;
    let resolvedClaim: any;
    function getValidClaim(u: string) {
      if (u.replace('lbry://', '').length <= 1) return;
      resolvedClaim = selectClaimForUri(state, u);
      if (resolvedClaim === null && punctuationMarks.includes(u.charAt(u.length - 1))) {
        getValidClaim(u.substring(0, u.length - 1));
      } else {
        testUri = u;
      }
    }
    getValidClaim(testUri);
    return { resolvedUri: testUri, claim: resolvedClaim };
  });
  const uri = resolvedUri;
  const fullUri = inputUri;
  const isResolvingUri = useAppSelector((state) => selectIsUriResolving(state, uri));
  const doResolveUri = React.useCallback(
    (u: string, returnCachedClaims: boolean) => dispatch(doResolveUriAction(u, returnCachedClaims)),
    [dispatch]
  );
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
