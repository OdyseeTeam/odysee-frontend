import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { selectAccountChargesEnabled } from 'redux/selectors/stripe';
import { selectMyMembershipTiers, selectMembershipsByIdForChannelIds } from 'redux/selectors/memberships';
import {
  doMembershipList,
  doGetMembershipPerks,
  doMembershipAddTier,
  doDeactivateMembershipForId,
} from 'redux/actions/memberships';
import { doToast } from 'redux/actions/notifications';
import TiersTab from './view';

const select = (state, props) => {
  const { channelsToList } = props;
  const channelIds = channelsToList && channelsToList.map((channel) => channel.claim_id);

  return {
    bankAccountConfirmed: selectAccountChargesEnabled(state),
    membershipPerks: selectMyMembershipTiers(state),
    membershipsByChannelId: channelIds && selectMembershipsByIdForChannelIds(state, channelIds),
  };
};

const perform = {
  doOpenModal,
  doMembershipList,
  doGetMembershipPerks,
  doMembershipAddTier,
  doDeactivateMembershipForId,
  doToast,
};

export default connect(select, perform)(TiersTab);
