import { connect } from 'react-redux';
import {
  selectMembershipTiersForChannelUri,
  selectProtectedContentMembershipsForContentClaimId,
  selectMembersOnlyChatMembershipIdsForCreatorId,
  selectCheapestPlanForRestrictedIds,
} from 'redux/selectors/memberships';
import { selectChannelNameForUri, selectChannelClaimIdForUri, selectClaimForUri } from 'redux/selectors/claims';
import { selectHasSavedCard } from 'redux/selectors/stripe';
import { doMembershipList, doMembershipBuy } from 'redux/actions/memberships';
import { doGetCustomerStatus } from 'redux/actions/stripe';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { doToast } from 'redux/actions/notifications';
import { getChannelIdFromClaim } from 'util/claim';
import PreviewPage from './view';

const select = (state, props) => {
  const { uri, fileUri, membersOnly } = props;

  const claim = selectClaimForUri(state, fileUri);
  const fileClaimId = claim && claim.claim_id;
  const channelId = getChannelIdFromClaim(claim);

  let unlockableTierIds;
  if (fileClaimId) {
    if (membersOnly) {
      unlockableTierIds = selectMembersOnlyChatMembershipIdsForCreatorId(state, channelId);
    } else {
      unlockableTierIds = selectProtectedContentMembershipsForContentClaimId(state, fileClaimId);
    }
  }

  return {
    activeChannelClaim: selectActiveChannelClaim(state),
    creatorMemberships: selectMembershipTiersForChannelUri(state, uri),
    channelName: selectChannelNameForUri(state, uri),
    channelClaimId: selectChannelClaimIdForUri(state, uri),
    hasSavedCard: selectHasSavedCard(state),
    incognito: selectIncognito(state),
    unlockableTierIds,
    cheapestMembership: unlockableTierIds && selectCheapestPlanForRestrictedIds(state, unlockableTierIds),
  };
};

const perform = {
  doMembershipList,
  doGetCustomerStatus,
  doMembershipBuy,
  doToast,
};

export default connect(select, perform)(PreviewPage);
