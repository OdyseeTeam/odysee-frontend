// @flow
import { formatLbryUrlForWeb } from 'util/url';
import { VIEW, MEMBERSHIP } from 'constants/urlParams';
import { useHistory } from 'react-router';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import Button from 'component/button';
import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import { parseURI } from 'util/lbryURI';

type Props = {
  uri: string,
  permanentUrl: string,
  isChannelPage?: boolean,
  // -- redux --
  activeMembershipName: ?string,
  fetchingMemberships: boolean,
  creatorHasMemberships: ?boolean,
  doOpenModal: (id: string, {}) => void,
  doMembershipList: ({ channel_name: string, channel_id: string }) => void,
};

export default function ShareButton(props: Props) {
  const {
    uri,
    permanentUrl,
    isChannelPage,
    activeMembershipName,
    fetchingMemberships,
    creatorHasMemberships,
    doOpenModal,
    doMembershipList,
  } = props;

  const { push } = useHistory();

  console.log(fetchingMemberships)

  const userHasMembership = Boolean(activeMembershipName);

  function handleClick() {
    if (userHasMembership) {
      const channelPath = formatLbryUrlForWeb(uri);
      const urlParams = new URLSearchParams();
      urlParams.set(VIEW, MEMBERSHIP);

      push(`/${channelPath}?${urlParams}`);
    } else {
      doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri });
    }
  }

  React.useEffect(() => {
    if (creatorHasMemberships === undefined) {
      const { channelName, channelClaimId } = parseURI(permanentUrl);
      doMembershipList({ channel_name: `@${channelName}`, channel_id: channelClaimId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doMembershipList, permanentUrl]);

  if ((fetchingMemberships || creatorHasMemberships === undefined) && !isChannelPage) {
    return <Skeleton variant="text" animation="wave" sx={{ width: '10rem', height: 'var(--height-button)' }} />;
  }

  if ((userHasMembership || fetchingMemberships) && isChannelPage) {
    // No need to show the Member button on channel page
    // the Membership Tab is already there
    return null;
  }

  return (
    <Button
      button="alt"
      icon={ICONS.UPGRADE}
      label={activeMembershipName || __('Become A Member')}
      title={
        userHasMembership
          ? __('You are a "%membership_tier_name%" member', { membership_tier_name: activeMembershipName })
          : __('Become A Member')
      }
      onClick={handleClick}
      style={{ opacity: !creatorHasMemberships ? '0.7' : undefined }}
    />
  );
}
