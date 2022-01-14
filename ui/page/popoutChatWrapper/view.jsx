// @flow
import LivestreamChatLayout from 'component/livestreamChatLayout';
import Page from 'component/page';
import React from 'react';

type Props = {
  claim: StreamClaim,
  uri: string,
  doCommentSocketConnect: (string, string) => void,
  doCommentSocketDisconnect: (string) => void,
  doResolveUri: (string, boolean) => void,
};

function PopoutChatPage(props: Props) {
  const { claim, uri, doCommentSocketConnect, doCommentSocketDisconnect, doResolveUri } = props;

  const claimId = claim && claim.claim_id;

  React.useEffect(() => {
    if (!claimId) doResolveUri(uri, true);
  }, [claimId, doResolveUri, uri]);

  React.useEffect(() => {
    if (claimId) doCommentSocketConnect(uri, claimId);

    return () => {
      if (claimId) doCommentSocketDisconnect(claimId);
    };
  }, [claimId, doCommentSocketConnect, doCommentSocketDisconnect, uri]);

  return (
    <Page noSideNavigation noFooter noHeader isPopoutWindow>
      <LivestreamChatLayout uri={uri} isPopoutWindow />
    </Page>
  );
}

export default PopoutChatPage;
