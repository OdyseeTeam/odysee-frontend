import { connect } from 'react-redux';
import { selectCanReceiveFiatTipsForUri } from 'redux/selectors/stripe';
import { selectMembershipTiersForChannelUri, selectMembershipTiersForChannelId } from 'redux/selectors/memberships';
import { doTipAccountCheckForUri } from 'redux/actions/stripe';
import { selectIsChannelMineForClaimId, selectClaimForUri } from 'redux/selectors/claims';
import { doOpenModal } from 'redux/actions/app';
import PreviewPage from './view';

const select = (state, props) => {
  const { uri } = props;
  const { claim_id: claimId } = selectClaimForUri(state, props.uri) || {};
  const claim = selectClaimForUri(state, props.uri);

  let channelTitle = null;
  let channelUri = null;
  if (claim) {
    channelUri = claim.canonical_url;
    const { value, name } = claim;
    if (value && value.title) {
      channelTitle = value.title;
    } else {
      channelTitle = name;
    }
  }

  return {
    canReceiveFiatTips: selectCanReceiveFiatTipsForUri(state, uri),
    creatorMemberships: selectMembershipTiersForChannelUri(state, uri),
    membershipTiers: selectMembershipTiersForChannelId(state, claimId),
    channelIsMine: selectIsChannelMineForClaimId(state, claimId),
    channelTitle,
    channelUri,
  };
};

const perform = (dispatch) => ({
  doTipAccountCheckForUri,
  doOpenModal: (modal, props) => dispatch(doOpenModal(modal, props)),
});

export default connect(select, perform)(PreviewPage);
