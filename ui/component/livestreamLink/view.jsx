// @flow

import React from 'react';
import { useHistory } from 'react-router';
import { formatLbryUrlForWeb } from 'util/url';
import * as ICONS from 'constants/icons';
import Card from 'component/common/card';
import ClaimPreview from 'component/claimPreview';
import Icon from 'component/common/icon';

type Props = {
  title?: string,
  claimUri: string,
  doResolveUri: (uri: string) => void,
};

const LivestreamLink = (props: Props) => {
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
      className="livestream__channel-link claim-preview__wrapper--live"
      title={
        <h1 className="page__title">
          <Icon icon={ICONS.LIVESTREAM_MONOCHROME} />
          <label>{title || __('Live stream in progress')}</label>
        </h1>
      }
      onClick={() => push(formatLbryUrlForWeb(claimUri))}
    >
      <ClaimPreview uri={claimUri} type="inline" hideMenu />
    </Card>
  );
};

export default LivestreamLink;
