import * as ICONS from 'constants/icons';
import React from 'react';
import Icon from 'component/common/icon';
import * as COL from 'constants/collections';
import { useAppSelector } from 'redux/hooks';
import { selectClaimForUri } from 'redux/selectors/claims';
type Props = {
  uri: string;
  small: boolean;
};

function ClaimType(props: Props) {
  const { uri, small } = props;
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const { value_type: claimType } = claim || {};
  const size = small ? COL.ICON_SIZE : undefined;

  if (claimType === 'collection') {
    return <Icon size={size} icon={ICONS.PLAYLIST} />;
  } else if (claimType === 'channel') {
    return <Icon size={size} icon={ICONS.CHANNEL} />;
  } else if (claimType === 'repost') {
    return <Icon size={size} icon={ICONS.REPOST} />;
  }

  return <Icon icon={ICONS.DOWNLOADABLE} />;
}

export default React.memo(ClaimType);
