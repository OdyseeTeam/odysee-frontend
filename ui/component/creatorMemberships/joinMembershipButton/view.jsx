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
  validUserMembershipForChannel: ?any,
  creatorHasMemberships: boolean,
  creatorMembershipsFetched: boolean,
  doOpenModal: (id: string, {}) => void,
  doMembershipList: ({ channel_name: string, channel_id: string }) => void,
};

export default function JoinMembershipButton(props: Props) {
  const {
    uri,
    isChannelPage,
    permanentUrl,
    validUserMembershipForChannel,
    creatorHasMemberships,
    creatorMembershipsFetched,
    doOpenModal,
    doMembershipList,
  } = props;

  const userIsActiveMember = Boolean(validUserMembershipForChannel);
  const membershipName = validUserMembershipForChannel?.MembershipDetails?.name;

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

  // build link to membership tab of user's channel
  let memberPageUrl;
  if (userIsActiveMember || isChannelPage) {
    let channelPath = formatLbryUrlForWeb(uri);
    const urlParams = new URLSearchParams();
    urlParams.set(VIEW, MEMBERSHIP);
    // if you're on the channel page channelPath comes with a leading / already
    if (isChannelPage) channelPath = channelPath.substr(1);
    memberPageUrl = `/${channelPath}?${urlParams}`;
  }

  // link to membership tab of channel
  if (userIsActiveMember) {


    return (
      <Button
        button="alt"
        navigate={memberPageUrl}
        icon={ICONS.UPGRADE}
        label={membershipName}
        title={__('You are a "%membership_tier_name%" member', { membership_tier_name: membershipName })}
      />
    );
  }

  // open join membership modal
  return (
    <Button
      button="alt"
      icon={ICONS.UPGRADE}
      label={__('Join')}
      title={__('Become A Member')}
      // if on channel page, navigate to proper tab, otherwise open join modal
      onClick={!isChannelPage && (() => doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri }))}
      navigate={isChannelPage && memberPageUrl}
      style={{
        filter: !creatorHasMemberships ? 'brightness(50%)' : undefined,
      }}
    />
  );
}
