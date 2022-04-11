// @flow
import { formatLbryUrlForWeb } from 'util/url';
import { VIEW, MEMBERSHIP } from 'constants/urlParams';
import { useHistory } from 'react-router';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import Button from 'component/button';
import React from 'react';

type Props = {
  uri: string,
  // -- redux --
  membershipName: ?string,
  doOpenModal: (id: string, {}) => void,
  doMembershipMine: () => void,
};

export default function ShareButton(props: Props) {
  const { uri, membershipName, doOpenModal, doMembershipMine } = props;

  const { push } = useHistory();

  const hasMembership = Boolean(membershipName);

  function handleClick() {
    if (hasMembership) {
      const channelPath = formatLbryUrlForWeb(uri);
      const urlParams = new URLSearchParams();
      urlParams.set(VIEW, MEMBERSHIP);

      push(`/${channelPath}?${urlParams}`);
    } else {
      doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri });
    }
  }

  React.useEffect(() => {
    doMembershipMine();
  }, [doMembershipMine]);

  return (
    <Button
      button="alt"
      icon={ICONS.UPGRADE}
      label={membershipName || __('Become A Member')}
      title={
        hasMembership
          ? __('You are a "%membership_tier_name%" member', { membership_tier_name: membershipName })
          : __('Become A Member')
      }
      onClick={handleClick}
    />
  );
}
