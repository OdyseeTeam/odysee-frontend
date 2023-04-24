import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import {
  doCommentBlockWords,
  doCommentUnblockWords,
  doCommentModAddDelegate,
  doCommentModRemoveDelegate,
  doCommentModListDelegates,
  doFetchCreatorSettings,
  doUpdateCreatorSettings,
} from 'redux/actions/comments';
import {
  selectSettingsByChannelId,
  selectFetchingCreatorSettings,
  selectFetchingBlockedWords,
  selectModerationDelegatesById,
  selectMembersOnlyCommentsForChannelId,
} from 'redux/selectors/comments';
import { selectChannelHasMembershipTiersForId } from 'redux/selectors/memberships';
import { doListAllMyMembershipTiers } from 'redux/actions/memberships';
import { selectMyChannelClaims } from 'redux/selectors/claims';
import CreatorSettingsTab from './view';

const select = (state, props) => {
  return {
    channelHasMembershipTiers: selectChannelHasMembershipTiersForId(state, props.activeChannelClaim.claim_id),
    fetchingBlockedWords: selectFetchingBlockedWords(state),
    fetchingCreatorSettings: selectFetchingCreatorSettings(state),
    moderationDelegatesById: selectModerationDelegatesById(state),
    myChannelClaims: selectMyChannelClaims(state),
    settingsByChannelId: selectSettingsByChannelId(state),
    areCommentsMembersOnly: selectMembersOnlyCommentsForChannelId(state, props.activeChannelClaim.claim_id),
  };
};

const perform = (dispatch) => ({
  commentBlockWords: (channelClaim, words) => dispatch(doCommentBlockWords(channelClaim, words)),
  commentUnblockWords: (channelClaim, words) => dispatch(doCommentUnblockWords(channelClaim, words)),
  fetchCreatorSettings: (channelClaimId) => dispatch(doFetchCreatorSettings(channelClaimId)),
  updateCreatorSettings: (channelClaim, settings) => dispatch(doUpdateCreatorSettings(channelClaim, settings)),
  commentModAddDelegate: (modChanId, modChanName, creatorChannelClaim) =>
    dispatch(doCommentModAddDelegate(modChanId, modChanName, creatorChannelClaim)),
  commentModRemoveDelegate: (modChanId, modChanName, creatorChannelClaim) =>
    dispatch(doCommentModRemoveDelegate(modChanId, modChanName, creatorChannelClaim)),
  commentModListDelegates: (creatorChannelClaim) => dispatch(doCommentModListDelegates(creatorChannelClaim)),
  doOpenModal: (modal, props) => dispatch(doOpenModal(modal, props)),
  listAllMyMembershipTiers: (channelId) => dispatch(doListAllMyMembershipTiers()),
});

export default connect(select, perform)(CreatorSettingsTab);
