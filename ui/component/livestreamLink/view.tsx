import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatLbryUrlForWeb } from 'util/url';
import * as ICONS from 'constants/icons';
import Card from 'component/common/card';
import ClaimPreview from 'component/claimPreview';
import Icon from 'component/common/icon';
import { useAppDispatch } from 'redux/hooks';
import { doResolveUri } from 'redux/actions/claims';

type Props = {
  title?: string;
  claimUri: string;
};

const LivestreamLink = (props: Props) => {
  const { claimUri, title = null } = props;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  React.useEffect(() => {
    if (claimUri) {
      dispatch(doResolveUri(claimUri));
    }
  }, [claimUri, dispatch]);
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
      onClick={() => navigate(formatLbryUrlForWeb(claimUri))}
    >
      <ClaimPreview uri={claimUri} type="inline" hideMenu />
    </Card>
  );
};

export default LivestreamLink;
