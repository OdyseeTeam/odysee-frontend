import { connect } from 'react-redux';
import {
  selectClaimIsMine,
  selectTitleForUri,
  makeSelectCoverForUri,
  selectClaimForUri,
  selectIsClaimOdyseeChannelForUri,
  makeSelectClaimIsPending,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { selectMyUnpublishedCollections } from 'redux/selectors/collections';
import { selectBlacklistedOutpointMap, doFetchSubCount, selectSubCountForUri, selectBanStateForUri } from 'lbryinc';
import { selectYoutubeChannels } from 'redux/selectors/user';
import { selectIsSubscribedForUri } from 'redux/selectors/subscriptions';
import { selectModerationBlockList } from 'redux/selectors/comments';
import { selectMutedChannels } from 'redux/selectors/blocked';
import { doOpenModal } from 'redux/actions/app';
import { selectLanguage, selectIsAgeRestrictedContentAllowed } from 'redux/selectors/settings';
import { selectOdyseeMembershipForChannelId, selectMembershipMineFetched } from 'redux/selectors/memberships';
import { getThumbnailFromClaim, isClaimNsfw } from 'util/claim';
import { doGetMembershipTiersForChannelClaimId, doMembershipMine } from 'redux/actions/memberships';
import { PREFERENCE_EMBED, AGE_RESTRICED_CHANNEL_IMAGES_TAG } from 'constants/tags';
import ChannelPage from './view';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);

  return {
    title: selectTitleForUri(state, props.uri),
    thumbnail: getThumbnailFromClaim(claim),
    coverUrl: makeSelectCoverForUri(props.uri)(state),
    channelIsMine: selectClaimIsMine(state, claim),
    claim,
    isSubscribed: selectIsSubscribedForUri(state, props.uri),
    blackListedOutpointMap: selectBlacklistedOutpointMap(state),
    subCount: selectSubCountForUri(state, props.uri),
    pending: makeSelectClaimIsPending(props.uri)(state),
    youtubeChannels: selectYoutubeChannels(state),
    blockedChannels: selectModerationBlockList(state),
    mutedChannels: selectMutedChannels(state),
    unpublishedCollections: selectMyUnpublishedCollections(state),
    lang: selectLanguage(state),
    odyseeMembership: selectOdyseeMembershipForChannelId(state, claim.claim_id),
    myMembershipsFetched: selectMembershipMineFetched(state),
    isOdyseeChannel: selectIsClaimOdyseeChannelForUri(state, props.uri),
    preferEmbed: makeSelectTagInClaimOrChannelForUri(props.uri, PREFERENCE_EMBED)(state),
    banState: selectBanStateForUri(state, props.uri),
    isMature: claim ? isClaimNsfw(claim) : false,
    isImagesAgeRestricted: makeSelectTagInClaimOrChannelForUri(props.uri, AGE_RESTRICED_CHANNEL_IMAGES_TAG)(state),
    isAgeRestrictedContentAllowed: selectIsAgeRestrictedContentAllowed(state),
  };
};

const perform = (dispatch) => ({
  openModal: (modal, props) => dispatch(doOpenModal(modal, props)),
  fetchSubCount: (claimId) => dispatch(doFetchSubCount(claimId)),
  getMembershipTiersForChannel: (channelId) => dispatch(doGetMembershipTiersForChannelClaimId(channelId)),
  doMembershipMine: () => dispatch(doMembershipMine()),
});

export default connect(select, perform)(ChannelPage);
