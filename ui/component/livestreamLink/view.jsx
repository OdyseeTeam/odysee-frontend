// @flow

import React from 'react';
import Card from 'component/common/card';
import ClaimPreview from 'component/claimPreview';
import { useHistory } from 'react-router';
import { formatLbryUrlForWeb } from 'util/url';

import withLiveStatus from 'hocs/withLiveStatus';

type Props = {
  title?: string,
  claimUri: string,
  doResolveUri: (uri: string) => void,
};

function LivestreamLink(props: Props) {
  const { claimUri, title = null, doResolveUri } = props;
  const { push } = useHistory();

  React.useEffect(() => {
    if (claimUri) {
      doResolveUri(claimUri);
    }
  }, [claimUri, doResolveUri]);

  if (!claimUri) return null;

  return (
    <Card
      className="livestream__channel-link claim-preview__live"
      title={title || __('Live stream in progress')}
      onClick={() => push(formatLbryUrlForWeb(claimUri))}
    >
      <ClaimPreview uri={claimUri} type="inline" hideMenu />
    </Card>
  );
}

export default withLiveStatus(LivestreamLink);
