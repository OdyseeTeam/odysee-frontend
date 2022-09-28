// @flow
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import * as React from 'react';
import Icon from 'component/common/icon';
import Button from 'component/button';

import { AppContext } from 'component/app/view';

type Props = {
  claimIsMine: boolean,
  isProtected: boolean,
  uri: string,
  userIsAMember: boolean,
  doOpenModal: (string, {}) => void,
};

export default function ProtectedContentOverlay(props: Props) {
  const { claimIsMine, uri, isProtected, userIsAMember, doOpenModal } = props;

  const fileUri = React.useContext(AppContext)?.uri;

  if (!isProtected || userIsAMember || claimIsMine) return null;

  return (
    <div className="protected-content-overlay">
      <div>
        <Icon icon={ICONS.LOCK} />
        <span>{__('Only channel members can view this content')}</span>
        <Button
          button="primary"
          icon={ICONS.MEMBERSHIP}
          label={__('Membership Options')}
          title={__('Become A Member')}
          onClick={() => doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri, fileUri })}
        />
      </div>
    </div>
  );
}
