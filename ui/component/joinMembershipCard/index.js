import { connect } from 'react-redux';
import {
  selectMembershipTiersForChannelUri,
  selectProtectedContentMembershipsForContentClaimId,
  selectCheapestProtectedContentMembershipForId,
} from 'redux/selectors/memberships';
import { selectChannelNameForUri, selectChannelClaimIdForUri, selectClaimIdForUri } from 'redux/selectors/claims';
import { selectHasSavedCard } from 'redux/selectors/stripe';
import { doMembershipList, doMembershipBuy } from 'redux/actions/memberships';
import { doGetCustomerStatus } from 'redux/actions/stripe';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { doToast } from 'redux/actions/notifications';
import PreviewPage from './view';

const select = (state, props) => {
  const { uri, fileUri } = props;

  const fileClaimId = selectClaimIdForUri(state, fileUri);

  return {
    activeChannelClaim: selectActiveChannelClaim(state),
    creatorMemberships: selectMembershipTiersForChannelUri(state, uri),
    channelName: selectChannelNameForUri(state, uri),
    channelClaimId: selectChannelClaimIdForUri(state, uri),
    hasSavedCard: selectHasSavedCard(state),
    incognito: selectIncognito(state),
    protectedMembershipIds: fileClaimId && selectProtectedContentMembershipsForContentClaimId(state, fileClaimId),
    cheapestMembership: fileClaimId && selectCheapestProtectedContentMembershipForId(state, fileClaimId),
  };
};

const perform = {
  doMembershipList,
  doGetCustomerStatus,
  doMembershipBuy,
  doToast,
};

export default connect(select, perform)(PreviewPage);
