import * as ICONS from 'constants/icons';
import * as React from 'react';
import classnames from 'classnames';
import Icon from 'component/common/icon';
import FilePrice from 'component/filePrice';
import ClaimType from 'component/claimType';
import * as COL from 'constants/collections';
import { useAppSelector } from 'redux/hooks';
import { selectClaimIsMine, selectClaimForUri } from 'redux/selectors/claims';
import { selectIsSubscribedForUri } from 'redux/selectors/subscriptions';
type Props = {
  uri: string;
  small: boolean;
  iconOnly: boolean;
};
export default function ClaimProperties(props: Props) {
  const { uri, small = false, iconOnly } = props;
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const isSubscribed = useAppSelector((state) => selectIsSubscribedForUri(state, uri));
  const claimIsMine = useAppSelector((state) => selectClaimIsMine(state, claim));
  const isCollection = claim && claim.value_type === 'collection';
  const size = small ? COL.ICON_SIZE : undefined;
  return (
    <div
      className={classnames('claim-preview__overlay-properties', {
        'claim-preview__overlay-properties--small': small,
      })}
    >
      {
        <>
          <ClaimType uri={uri} small />
          {/* {isCollection && claim && claim.value.claims && !iconOnly && <div>{claim.value.claims.length}</div>}
          {isSubscribed && <Icon size={size} tooltip icon={ICONS.SUBSCRIBE} />}
          <FilePrice hideFree uri={uri} /> */}
        </>
      }
    </div>
  );
}
