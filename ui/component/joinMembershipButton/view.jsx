// @flow
import React from 'react';

import { ChannelPageContext } from 'contexts/channel';
import { formatLbryUrlForWeb } from 'util/url';
import { CHANNEL_PAGE } from 'constants/urlParams';

import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';

import Button from 'component/button';

import { AppContext } from 'component/app/view';

const DEFAULT_PROPS = { button: 'alt', icon: ICONS.MEMBERSHIP };

type Props = {
  uri: string,
  // -- redux --
  validUserMembershipForChannel: ?any,
  creatorHasMemberships: boolean,
  creatorMembershipsFetched: boolean,
  creatorTiers: ?CreatorMemberships,
  isOdyseeChannel: boolean,
  channelName: ?string,
  channelClaimId: ?string,
  doOpenModal: (id: string, {}) => void,
  doMembershipList: ({ channel_name: string, channel_id: string }) => Promise<CreatorMemberships>,
};

const JoinMembershipButton = (props: Props) => {
  const {
    uri,
    validUserMembershipForChannel,
    creatorHasMemberships,
    creatorMembershipsFetched,
    isOdyseeChannel,
    channelName,
    channelClaimId,
    doOpenModal,
    doMembershipList,
    creatorTiers,
  } = props;

  const fileUri = React.useContext(AppContext)?.uri;
  const isChannelPage = React.useContext(ChannelPageContext);

  const userIsActiveMember = Boolean(validUserMembershipForChannel);
  const membershipName = validUserMembershipForChannel?.MembershipDetails?.name;

  React.useEffect(() => {
    if (!creatorMembershipsFetched && channelName && channelClaimId) {
      doMembershipList({ channel_name: `@${channelName}`, channel_id: channelClaimId }).catch((e) => {});
    }
  }, [channelClaimId, channelName, creatorMembershipsFetched, doMembershipList]);

  if (isOdyseeChannel) return null;

  if (userIsActiveMember && creatorTiers) {
    // build link to membership tab of user's channel
    let channelPath = formatLbryUrlForWeb(uri);
    const urlParams = new URLSearchParams();
    urlParams.set(CHANNEL_PAGE.QUERIES.VIEW, CHANNEL_PAGE.VIEWS.MEMBERSHIP);
    // if you're on the channel page channelPath comes with a leading / already
    if (isChannelPage) channelPath = channelPath.substr(1);

    const membershipIndex =
      creatorTiers.findIndex((res) => res.Membership.id === validUserMembershipForChannel?.Membership?.membership_id) +
      1;

    return (
      <Button
        {...DEFAULT_PROPS}
        navigate={`${channelPath}?${urlParams.toString()}`}
        label={membershipName}
        title={__('You are a "%membership_tier_name%" member', { membership_tier_name: membershipName })}
        className="button--membership-active"
        style={{ backgroundColor: 'rgba(var(--color-membership-' + membershipIndex + '), 1)' }}
      />
    );
  }

  return (
    <Button
      {...DEFAULT_PROPS}
      className="button--membership"
      label={__('Join')}
      title={__('Become A Member')}
      onClick={() => doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri, fileUri })}
      style={{ filter: !creatorHasMemberships ? 'brightness(50%)' : undefined }}
    />
  );
};

export default JoinMembershipButton;
