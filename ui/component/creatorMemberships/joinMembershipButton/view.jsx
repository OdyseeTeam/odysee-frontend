// @flow
import { formatLbryUrlForWeb } from 'util/url';
import { VIEW, MEMBERSHIP } from 'constants/urlParams';
import { useHistory } from 'react-router';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import Button from 'component/button';
import React from 'react';
import { parseURI } from 'util/lbryURI';

type Props = {
  uri: string,
  permanentUrl: string,
  isChannelPage?: boolean,
  // -- redux --
  activeChannelMembershipName: ?string,
  creatorHasMemberships: boolean,
  creatorMembershipsFetched: boolean,
  doOpenModal: (id: string, {}) => void,
  doMembershipList: ({ channel_name: string, channel_id: string }) => void,
};

export default function ShareButton(props: Props) {
  const {
    uri,
    permanentUrl,
    isChannelPage,
    activeChannelMembershipName,
    creatorHasMemberships,
    creatorMembershipsFetched,
    doOpenModal,
    doMembershipList,
  } = props;

  const { push } = useHistory();

  const userIsActiveMember = Boolean(activeChannelMembershipName);

  function handleClick() {
    if (userIsActiveMember) {
      const channelPath = formatLbryUrlForWeb(uri);
      const urlParams = new URLSearchParams();
      urlParams.set(VIEW, MEMBERSHIP);

      push(`/${channelPath}?${urlParams}`);
    } else {
      doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri });
    }
  }

  React.useEffect(() => {
    if (!creatorMembershipsFetched) {
      const { channelName, channelClaimId } = parseURI(permanentUrl);
      doMembershipList({ channel_name: `@${channelName}`, channel_id: channelClaimId });
    }
  }, [creatorMembershipsFetched, doMembershipList, permanentUrl]);

  if (userIsActiveMember && isChannelPage) {
    // No need to show the Member button on channel page
    // the Membership Tab is already there
    return null;
  }

  return (
    <Button
      button="alt"
      icon={ICONS.UPGRADE}
      label={activeChannelMembershipName || __('Memberships')}
      title={
        userIsActiveMember
          ? __('You are a "%membership_tier_name%" member', { membership_tier_name: activeChannelMembershipName })
          : __('Become A Member')
      }
      onClick={handleClick}
      style={{
        opacity: !userIsActiveMember && !creatorHasMemberships ? '0.7' : undefined,
      }}
    />
  );
}
