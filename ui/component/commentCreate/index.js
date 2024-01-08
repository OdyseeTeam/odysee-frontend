import { connect } from 'react-redux';
import {
  selectClaimForUri,
  selectClaimIsMine,
  selectHasChannels,
  selectFetchingMyChannels,
  makeSelectTagInClaimOrChannelForUri,
  selectMyChannelClaimIds,
  selectedRestrictedCommentsChatTagForUri,
} from 'redux/selectors/claims';
import { CommentCreate } from './view';
import { DISABLE_SUPPORT_TAG } from 'constants/tags';
import {
  doCommentCreate,
  doFetchCreatorSettings,
  doCommentById,
  doFetchMyCommentedChannels,
} from 'redux/actions/comments';
import { doSendTip, doSendCashTip } from 'redux/actions/wallet';
import { doToast } from 'redux/actions/notifications';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import {
  selectMyCommentedChannelIdsForId,
  selectCommentsDisabledSettingForChannelId,
  selectLivestreamChatMembersOnlyForChannelId,
  selectMembersOnlyCommentsForChannelId,
  selectFetchingCreatorSettings,
} from 'redux/selectors/comments';
import { getChannelIdFromClaim } from 'util/claim';
import { doOpenModal } from 'redux/actions/app';
import { selectPreferredCurrency } from 'redux/selectors/settings';
import { selectCanReceiveFiatTipsForUri } from 'redux/selectors/stripe';
import { doTipAccountCheckForUri } from 'redux/actions/stripe';
import {
  selectUserHasOdyseePremiumPlus,
  selectUserIsMemberOfMembersOnlyChatForCreatorId,
} from 'redux/selectors/memberships';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);
  const { claim_id: claimId, name, signing_channel: channel } = claim || {};

  // setup variables for tip API
  const channelClaimId = getChannelIdFromClaim(claim);
  const tipChannelName = channel ? channel.name : name;

  const activeChannelClaim = selectActiveChannelClaim(state);
  const {
    claim_id: activeChannelClaimId,
    name: activeChannelName,
    canonical_url: activeChannelUrl,
  } = activeChannelClaim || {};

  return {
    activeChannelClaimId,
    activeChannelName,
    activeChannelUrl,
    canReceiveFiatTips: selectCanReceiveFiatTipsForUri(state, uri),
    channelClaimId,
    chatCommentsRestrictedToChannelMembers: Boolean(selectedRestrictedCommentsChatTagForUri(state, uri)),
    claimId,
    claimIsMine: selectClaimIsMine(state, claim),
    hasChannels: selectHasChannels(state),
    isFetchingChannels: selectFetchingMyChannels(state),
    isFetchingCreatorSettings: selectFetchingCreatorSettings(state),
    myChannelClaimIds: selectMyChannelClaimIds(state),
    myCommentedChannelIds: selectMyCommentedChannelIdsForId(state, claim?.claim_id),
    preferredCurrency: selectPreferredCurrency(state),
    channelSettings: state.comments.settingsByChannelId[channelClaimId],
    supportDisabled: makeSelectTagInClaimOrChannelForUri(uri, DISABLE_SUPPORT_TAG)(state),
    tipChannelName,
    userHasMembersOnlyChatPerk: selectUserIsMemberOfMembersOnlyChatForCreatorId(state, channelClaimId),
    commentSettingDisabled: selectCommentsDisabledSettingForChannelId(state, channelClaimId),
    isLivestreamChatMembersOnly: Boolean(selectLivestreamChatMembersOnlyForChannelId(state, channelClaimId)),
    areCommentsMembersOnly: Boolean(selectMembersOnlyCommentsForChannelId(state, channelClaimId)),
    hasPremiumPlus: selectUserHasOdyseePremiumPlus(state),
  };
};

const perform = {
  doCommentCreate,
  doFetchCreatorSettings,
  doFetchMyCommentedChannels,
  doToast,
  doCommentById,
  doSendCashTip,
  doSendTip,
  doOpenModal,
  doTipAccountCheckForUri,
};

export default connect(select, perform)(CommentCreate);
