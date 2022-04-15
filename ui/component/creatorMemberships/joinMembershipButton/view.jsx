// @flow
import { formatLbryUrlForWeb } from 'util/url';
import { VIEW, MEMBERSHIP } from 'constants/urlParams';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import Button from 'component/button';
import React from 'react';
import { parseURI } from 'util/lbryURI';

type Props = {
  uri: string,
  isChannelPage?: boolean,
  // -- redux --
  permanentUrl?: string,
  activeChannelMembershipName: ?string,
  creatorHasMemberships: boolean,
  creatorMembershipsFetched: boolean,
  doOpenModal: (id: string, {}) => void,
  doMembershipList: ({ channel_name: string, channel_id: string }) => void,
};

export default function ShareButton(props: Props) {
  const {
    uri,
    isChannelPage,
    permanentUrl,
    activeChannelMembershipName,
    creatorHasMemberships,
    creatorMembershipsFetched,
    doOpenModal,
    doMembershipList,
  } = props;

  const userIsActiveMember = Boolean(activeChannelMembershipName);

  React.useEffect(() => {
    if (!creatorMembershipsFetched) {
      const { channelName, channelClaimId } = parseURI(permanentUrl || '');
      doMembershipList({ channel_name: `@${channelName || ''}`, channel_id: channelClaimId || '' });
    }
  }, [creatorMembershipsFetched, doMembershipList, permanentUrl]);

  if (userIsActiveMember && isChannelPage) {
    // No need to show the Member button on channel page
    // the Membership Tab is already there
    return null;
  }

  let memberPageUrl;
  if (userIsActiveMember) {
    const channelPath = formatLbryUrlForWeb(uri);
    const urlParams = new URLSearchParams();
    urlParams.set(VIEW, MEMBERSHIP);
    // $FlowFixMe
    memberPageUrl = `/${channelPath}?${urlParams}`;
  }

  if (userIsActiveMember) {
    return (
      <Button
        button="alt"
        navigate={memberPageUrl}
        icon={ICONS.UPGRADE}
        label={activeChannelMembershipName}
        title={__('You are a "%membership_tier_name%" member', { membership_tier_name: activeChannelMembershipName })}
      />
    );
  }

  return (
    <Button
      button="alt"
      icon={ICONS.UPGRADE}
      label={__('Memberships')}
      title={__('Become A Member')}
      onClick={() => doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri })}
      style={{
        filter: !creatorHasMemberships ? 'brightness(50%)' : undefined,
      }}
    />
  );
}
