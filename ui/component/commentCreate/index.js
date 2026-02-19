import { connect } from 'react-redux';
import { hasLegacyOdyseePremium } from 'redux/selectors/user';
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
  const { uri, claimIdOverride } = props;

  const claim = selectClaimForUri(state, uri);
  const { claim_id: claimId, name, signing_channel: channel } = claim || {};
  const effectiveClaimId = claimIdOverride || claimId;

  // setup variables for tip API
  const channelClaimId = claimIdOverride ? undefined : getChannelIdFromClaim(claim);
  const tipChannelName = claimIdOverride ? undefined : channel ? channel.name : name;

  const activeChannelClaim = selectActiveChannelClaim(state);
  const {
    claim_id: activeChannelClaimId,
    name: activeChannelName,
    canonical_url: activeChannelUrl,
  } = activeChannelClaim || {};

  const tipData = channelClaimId ? selectArweaveTipDataForId(state, channelClaimId) : undefined;
  const canReceiveTips = tipData?.status === 'active' && tipData?.default;

  return {
    activeChannelClaimId,
    activeChannelName,
    activeChannelUrl,
    channelClaimId,
    chatCommentsRestrictedToChannelMembers: claimIdOverride
      ? false
      : Boolean(selectedRestrictedCommentsChatTagForUri(state, uri)),
    claimId: effectiveClaimId,
    claimIsMine: claimIdOverride ? false : selectClaimIsMine(state, claim),
    hasChannels: selectHasChannels(state),
    isFetchingChannels: selectFetchingMyChannels(state),
    isFetchingCreatorSettings: selectFetchingCreatorSettings(state),
    myChannelClaimIds: selectMyChannelClaimIds(state),
    myCommentedChannelIds: selectMyCommentedChannelIdsForId(state, effectiveClaimId),
    preferredCurrency: selectPreferredCurrency(state),
    channelSettings: channelClaimId ? state.comments.settingsByChannelId[channelClaimId] : undefined,
    supportDisabled: claimIdOverride ? true : makeSelectTagInClaimOrChannelForUri(uri, DISABLE_SUPPORT_TAG)(state),
    tipChannelName,
    userHasMembersOnlyChatPerk: channelClaimId
      ? selectUserIsMemberOfMembersOnlyChatForCreatorId(state, channelClaimId)
      : false,
    commentSettingDisabled: channelClaimId ? selectCommentsDisabledSettingForChannelId(state, channelClaimId) : false,
    isLivestreamChatMembersOnly: channelClaimId
      ? Boolean(selectLivestreamChatMembersOnlyForChannelId(state, channelClaimId))
      : false,
    areCommentsMembersOnly: channelClaimId
      ? Boolean(selectMembersOnlyCommentsForChannelId(state, channelClaimId))
      : false,
    hasPremiumPlus: hasLegacyOdyseePremium(state),
    recipientArweaveTipInfo: channelClaimId ? selectArweaveTipDataForId(state, channelClaimId) : null,
    arweaveTippingError: channelClaimId ? selectArweaveTippingErrorForId(state, channelClaimId) : '',
    canReceiveTips: claimIdOverride ? false : canReceiveTips,
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
