import { connect } from 'react-redux';
import { MAX_LIVESTREAM_COMMENTS } from 'constants/livestream';
import { doResolveUris } from 'redux/actions/claims';
import { selectClaimForUri, selectProtectedContentTagForUri, selectClaimIsMine, selectMyChannelClaims } from 'redux/selectors/claims';
import { doCommentList, doHyperChatList, setLivestreamChatMembersOnlyCreatorSetting } from 'redux/actions/comments';
import {
  selectTopLevelCommentsForUri,
  selectHyperChatsForUri,
  selectPinnedCommentsForUri,
  selectSettingsByChannelId,
} from 'redux/selectors/comments';
import {
  doFetchOdyseeMembershipForChannelIds,
  doFetchChannelMembershipsForChannelIds,
  doListAllMyMembershipTiers,
} from 'redux/actions/memberships';
import { selectIfUnauthorizedForContent, selectIfChannelHasMembershipTiers } from 'redux/selectors/memberships';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { getChannelIdFromClaim } from 'util/claim';

import ChatLayout from './view';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri);
  const claimId = claim && claim.claim_id;
  const channelId = getChannelIdFromClaim(claim);

  const activeChannelClaim = selectActiveChannelClaim(state);
  const activeChannelId = activeChannelClaim?.claim_id;

  return {
    activeChannelClaim,
    activeChannelId,
    claimId,
    claimIsMine: props.uri && selectClaimIsMine(state, claim),
    comments: selectTopLevelCommentsForUri(state, uri, MAX_LIVESTREAM_COMMENTS),
    pinnedComments: selectPinnedCommentsForUri(state, uri),
    superChats: selectHyperChatsForUri(state, uri),
    channelId,
    chatCommentsRestrictedToChannelMembers: Boolean(selectProtectedContentTagForUri(state, uri)),
    unauthorizedForContent: selectIfUnauthorizedForContent(state, channelId, claimId, uri),
    settingsByChannelId: selectSettingsByChannelId(state),
    myChannelClaims: selectMyChannelClaims(state),
    channelHasMembershipTiers: selectIfChannelHasMembershipTiers(state, activeChannelId),
  };
};

const perform = {
  doCommentList,
  doHyperChatList,
  doResolveUris,
  doFetchOdyseeMembershipForChannelIds,
  doFetchChannelMembershipsForChannelIds,
  setLivestreamChatMembersOnlyCreatorSetting,
  doListAllMyMembershipTiers,
};

export default connect(select, perform)(ChatLayout);
