// @flow
import React from 'react';

import { ChannelPageContext } from 'page/channel/view';
import { parseURI } from 'util/lbryURI';
import { formatLbryUrlForWeb } from 'util/url';
import { CHANNEL_PAGE } from 'constants/urlParams';

import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';

import Button from 'component/button';

const DEFAULT_PROPS = { button: 'alt', className: 'button--membership', icon: ICONS.UPGRADE };

type Props = {
  uri: string,
  // -- redux --
  permanentUrl?: string,
  validUserMembershipForChannel: ?any,
  creatorHasMemberships: boolean,
  creatorMembershipsFetched: boolean,
  doOpenModal: (id: string, {}) => void,
  doMembershipList: ({ channel_name: string, channel_id: string }) => Promise<CreatorMemberships>,
};

const JoinMembershipButton = (props: Props) => {
  const {
    uri,
    permanentUrl,
    validUserMembershipForChannel,
    creatorHasMemberships,
    creatorMembershipsFetched,
    doOpenModal,
    doMembershipList,
  } = props;

  const isChannelPage = React.useContext(ChannelPageContext);

  const userIsActiveMember = Boolean(validUserMembershipForChannel);
  const membershipName = validUserMembershipForChannel?.MembershipDetails?.name;

  React.useEffect(() => {
    if (!creatorMembershipsFetched) {
      const { channelName, channelClaimId } = parseURI(permanentUrl || '');
      doMembershipList({ channel_name: `@${channelName || ''}`, channel_id: channelClaimId || '' });
    }
  }, [creatorMembershipsFetched, doMembershipList, permanentUrl]);

  if (userIsActiveMember) {
    // build link to membership tab of user's channel
    let channelPath = formatLbryUrlForWeb(uri);
    const urlParams = new URLSearchParams();
    urlParams.set(CHANNEL_PAGE.QUERIES.VIEW, CHANNEL_PAGE.VIEWS.MEMBERSHIP);
    // if you're on the channel page channelPath comes with a leading / already
    if (isChannelPage) channelPath = channelPath.substr(1);

    return (
      <Button
        {...DEFAULT_PROPS}
        navigate={`${channelPath}?${urlParams.toString()}`}
        label={membershipName}
        title={__('You are a "%membership_tier_name%" member', { membership_tier_name: membershipName })}
      />
    );
  }

  return (
    <Button
      {...DEFAULT_PROPS}
      label={__('Join')}
      title={__('Become A Member')}
      onClick={() => doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri })}
      style={{ filter: !creatorHasMemberships ? 'brightness(50%)' : undefined }}
    />
  );
};

export default JoinMembershipButton;
