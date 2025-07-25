import { connect } from 'react-redux';
import { hasLegacyOdyseePremium, selectUserExperimentalUi } from 'redux/selectors/user';
import {
  selectClaimForUri,
  selectClaimIsMine,
  selectHasChannels,
  selectFetchingMyChannels,
  makeSelectTagInClaimOrChannelForUri,
  selectMyChannelClaimIds,
  selectedRestrictedCommentsChatTagForUri,
} from 'redux/selectors/claims';
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
import { selectArweaveTipDataForId } from 'redux/selectors/stripe';
import { doTipAccountCheckForUri } from 'redux/actions/stripe';
import { selectUserIsMemberOfMembersOnlyChatForCreatorId } from 'redux/selectors/memberships';
import { doArTip } from 'redux/actions/arwallet';
import { CommentCreate } from './view';
import { selectArweaveTippingErrorForId } from 'redux/selectors/arwallet';

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

  const tipData = selectArweaveTipDataForId(state, channelClaimId);
  const canReceiveTips = tipData?.status === 'active' && tipData?.default;

  return {
    activeChannelClaimId,
    activeChannelName,
    activeChannelUrl,
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
    hasPremiumPlus: hasLegacyOdyseePremium(state),
    experimentalUi: selectUserExperimentalUi(state),
    recipientArweaveTipInfo: selectArweaveTipDataForId(state, channelClaimId),
    arweaveTippingError: selectArweaveTippingErrorForId(state, channelClaimId),
    canReceiveTips,
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
  doArTip,
};

export default connect(select, perform)(CommentCreate);
