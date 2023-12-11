import { connect } from 'react-redux';
import { selectClaimForUri, selectClaimIsMine, selectIsUriUnlisted } from 'redux/selectors/claims';
import { doPrepareEdit } from 'redux/actions/publish';
import { doRemovePersonalRecommendation } from 'redux/actions/search';
import {
  selectCollectionForId,
  selectCollectionForIdHasClaimUrl,
  selectCollectionIsMine,
  selectCollectionHasEditsForId,
  selectLastUsedCollection,
  selectCollectionIsEmptyForId,
} from 'redux/selectors/collections';
import { makeSelectFileInfoForUri } from 'redux/selectors/file_info';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { makeSelectChannelIsMuted } from 'redux/selectors/blocked';
import { doChannelMute, doChannelUnmute } from 'redux/actions/blocked';
import { doOpenModal } from 'redux/actions/app';
import {
  doCommentModBlock,
  doCommentModUnBlock,
  doCommentModBlockAsAdmin,
  doCommentModUnBlockAsAdmin,
} from 'redux/actions/comments';
import {
  selectHasAdminChannel,
  makeSelectChannelIsBlocked,
  makeSelectChannelIsAdminBlocked,
  // selectSettingsByChannelId,
} from 'redux/selectors/comments';
import { doToast } from 'redux/actions/notifications';
import { doChannelSubscribe, doChannelUnsubscribe } from 'redux/actions/subscriptions';
import { selectIsSubscribedForUri } from 'redux/selectors/subscriptions';
import { selectIsProtectedContentLockedFromUserForId } from 'redux/selectors/memberships';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import { doEnableCollectionShuffle, doFetchUriAccessKey, doPlaylistAddAndAllowPlaying } from 'redux/actions/content';
import { isStreamPlaceholderClaim } from 'util/claim';
import * as RENDER_MODES from 'constants/file_render_modes';
import ClaimPreview from './view';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri, false);
  const collectionId = props.collectionId;
  const repostedClaim = claim?.reposted_claim;
  const isRepost = Boolean(claim?.reposted_claim || claim?.value?.claim_hash);
  const contentClaim = repostedClaim || claim;
  const contentSigningChannel = contentClaim && contentClaim.signing_channel;
  const contentPermanentUri = contentClaim && contentClaim.permanent_url;
  const contentChannelUri = (contentSigningChannel && contentSigningChannel.permanent_url) || contentPermanentUri;
  const lastUsedCollectionId = selectLastUsedCollection(state);
  const lastUsedCollection = lastUsedCollectionId && selectCollectionForId(state, lastUsedCollectionId);
  const isLivestreamClaim = isStreamPlaceholderClaim(claim);
  const permanentUrl = (claim && claim.permanent_url) || '';
  const isPostClaim = makeSelectFileRenderModeForUri(permanentUrl)(state) === RENDER_MODES.MARKDOWN;
  const claimIsMine = selectClaimIsMine(state, claim);
  // const settingsByChannelId = selectSettingsByChannelId(state);

  return {
    claim,
    isRepost,
    contentClaim,
    contentSigningChannel,
    contentChannelUri,
    isLivestreamClaim,
    isPostClaim,
    claimIsMine,
    // settingsByChannelId,
    hasClaimInWatchLater: selectCollectionForIdHasClaimUrl(
      state,
      COLLECTIONS_CONSTS.WATCH_LATER_ID,
      contentPermanentUri
    ),
    hasClaimInFavorites: selectCollectionForIdHasClaimUrl(state, COLLECTIONS_CONSTS.FAVORITES_ID, contentPermanentUri),
    channelIsMuted: makeSelectChannelIsMuted(contentChannelUri)(state),
    channelIsBlocked: makeSelectChannelIsBlocked(contentChannelUri)(state),
    fileInfo: makeSelectFileInfoForUri(contentPermanentUri)(state),
    isSubscribed: selectIsSubscribedForUri(state, contentChannelUri),
    channelIsAdminBlocked: makeSelectChannelIsAdminBlocked(props.uri)(state),
    isAdmin: selectHasAdminChannel(state),
    claimInCollection: selectCollectionForIdHasClaimUrl(state, collectionId, contentPermanentUri),
    isMyCollection: selectCollectionIsMine(state, collectionId),
    isUnlisted: selectIsUriUnlisted(state, uri),
    hasEdits: selectCollectionHasEditsForId(state, collectionId),
    isAuthenticated: Boolean(selectUserVerifiedEmail(state)),
    lastUsedCollection,
    hasClaimInLastUsedCollection: selectCollectionForIdHasClaimUrl(state, lastUsedCollectionId, contentPermanentUri),
    lastUsedCollectionIsNotBuiltin:
      lastUsedCollectionId !== COLLECTIONS_CONSTS.WATCH_LATER_ID &&
      lastUsedCollectionId !== COLLECTIONS_CONSTS.FAVORITES_ID,
    collectionEmpty: selectCollectionIsEmptyForId(state, collectionId),
    isContentProtectedAndLocked:
      contentClaim && selectIsProtectedContentLockedFromUserForId(state, contentClaim.claim_id),
  };
};

const perform = {
  prepareEdit: doPrepareEdit,
  doToast,
  openModal: doOpenModal,
  doChannelMute,
  doChannelUnmute,
  doCommentModBlock,
  doCommentModUnBlock,
  doCommentModBlockAsAdmin,
  doCommentModUnBlockAsAdmin,
  doChannelSubscribe,
  doChannelUnsubscribe,
  doEnableCollectionShuffle,
  doRemovePersonalRecommendation,
  doPlaylistAddAndAllowPlaying,
  doFetchUriAccessKey,
};

export default connect(select, perform)(ClaimPreview);
