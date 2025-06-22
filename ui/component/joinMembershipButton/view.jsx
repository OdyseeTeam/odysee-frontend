// @flow
import React from 'react';
import moment from 'moment';
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
  tipsEnabled: any,
  channelName: ?string,
  channelClaimId: ?string,
  doOpenModal: (id: string, {}) => void,
  doMembershipList: (params: MembershipListParams) => Promise<CreatorMemberships>,
};

const JoinMembershipButton = (props: Props) => {
  const {
    uri,
    validUserMembershipForChannel,
    creatorHasMemberships,
    creatorMembershipsFetched,
    isOdyseeChannel,
    channelName,
    tipsEnabled,
    channelClaimId,
    doOpenModal,
    doMembershipList,
    creatorTiers,
  } = props;

  const fileUri = React.useContext(AppContext)?.uri;
  const isChannelPage = React.useContext(ChannelPageContext);

  const userIsActiveMember = Boolean(validUserMembershipForChannel);
  const membershipName = validUserMembershipForChannel?.membership.name;
  const endsAt = validUserMembershipForChannel?.subscription.ends_at;
  const membershipStatus = validUserMembershipForChannel?.subscription.status;

  const shouldRenew = endsAt && moment().isAfter(moment(endsAt).subtract(7, 'days')) && (membershipStatus === 'active' || membershipStatus === 'lapsed');
  // const shouldRenew = true;

  React.useEffect(() => {
    if (!creatorMembershipsFetched && channelName && channelClaimId) {
      doMembershipList({ channel_claim_id: channelClaimId }).catch((e) => {});
    }
  }, [channelClaimId, channelName, creatorMembershipsFetched, doMembershipList]);

  if (isOdyseeChannel) return null;

  if (userIsActiveMember && creatorTiers && creatorTiers.length) {
    // build link to membership tab of user's channel
    let channelPath = formatLbryUrlForWeb(uri);
    const urlParams = new URLSearchParams();
    urlParams.set(CHANNEL_PAGE.QUERIES.VIEW, CHANNEL_PAGE.VIEWS.MEMBERSHIP);
    // if you're on the channel page channelPath comes with a leading / already
    if (isChannelPage) channelPath = channelPath.substr(1);

    const membershipIndex =
      creatorTiers.findIndex((res) => res.name === validUserMembershipForChannel?.membership.name);
    /*
    membershipIndex: index, membershipId: membership.membership_id, passedTierIndex: index,
     */
    if (!creatorTiers || !creatorTiers.length) {
      return null;
    }

    // TODO use new membership.accespts_payments and check first_payment_due_at
    // if (!tipsEnabled) {
    //
    // }

    if (shouldRenew) {
      return (
        <Button
          {...DEFAULT_PROPS}
          className="button--membership"
          label={__('Renew "%membership_tier_name%"', { membership_tier_name: membershipName })}
          title={__('Renew "%membership_tier_name%"', { membership_tier_name: membershipName })}
          onClick={() => doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri, fileUri, isRenew: true, membershipIndex: membershipIndex, membershipId: validUserMembershipForChannel.membership.id, passedTierIndex: membershipIndex })}
          style={{ filter: (!creatorHasMemberships) ? 'brightness(50%)' : undefined }}
        />
      );
    }

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
      style={{ filter: (!creatorHasMemberships) ? 'brightness(50%)' : undefined }}
    />
  );
};

export default JoinMembershipButton;
