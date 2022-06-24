import { connect } from 'react-redux';
import { selectClaimForUri, selectClaimIsMine } from 'redux/selectors/claims';
import { doCollectionEdit, doFetchItemsInCollection } from 'redux/actions/collections';
import { doPrepareEdit } from 'redux/actions/publish';
import { doRemovePersonalRecommendation } from 'redux/actions/search';
import {
  selectCollectionForId,
  selectCollectionForIdHasClaimUrl,
  selectCollectionIsMine,
  selectEditedCollectionForId,
  selectUrlsForCollectionId,
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
} from 'redux/selectors/comments';
import { doToast } from 'redux/actions/notifications';
import { doChannelSubscribe, doChannelUnsubscribe } from 'redux/actions/subscriptions';
import { selectIsSubscribedForUri } from 'redux/selectors/subscriptions';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { selectListShuffleForId } from 'redux/selectors/content';
import { doToggleShuffleList } from 'redux/actions/content';
import ClaimPreview from './view';
import fs from 'fs';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri, false);
  const collectionId = props.collectionId;
  const repostedClaim = claim && claim.reposted_claim;
  const contentClaim = repostedClaim || claim;
  const contentSigningChannel = contentClaim && contentClaim.signing_channel;
  const contentPermanentUri = contentClaim && contentClaim.permanent_url;
  const contentChannelUri = (contentSigningChannel && contentSigningChannel.permanent_url) || contentPermanentUri;
  const collectionShuffle = selectListShuffleForId(state, collectionId);
  const playNextUri = collectionShuffle && collectionShuffle.newUrls[0];
  const lastUsedCollectionId = selectLastUsedCollection(state);
  const lastUsedCollection = lastUsedCollectionId && selectCollectionForId(state, lastUsedCollectionId);

  return {
    claim,
    repostedClaim,
    contentClaim,
    contentSigningChannel,
    contentChannelUri,
    claimIsMine: selectClaimIsMine(state, claim),
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
    editedCollection: selectEditedCollectionForId(state, collectionId),
    isAuthenticated: Boolean(selectUserVerifiedEmail(state)),
    resolvedList: selectUrlsForCollectionId(state, collectionId),
    playNextUri,
    lastUsedCollection,
    hasClaimInLastUsedCollection: selectCollectionForIdHasClaimUrl(state, lastUsedCollectionId, contentPermanentUri),
    lastUsedCollectionIsNotBuiltin:
      lastUsedCollectionId !== COLLECTIONS_CONSTS.WATCH_LATER_ID &&
      lastUsedCollectionId !== COLLECTIONS_CONSTS.FAVORITES_ID,
    collectionEmpty: selectCollectionIsEmptyForId(state, collectionId),
  };
};

const perform = (dispatch) => ({
  prepareEdit: (publishData, uri, fileInfo) => dispatch(doPrepareEdit(publishData, uri, fileInfo, fs)),
  doToast: (props) => dispatch(doToast(props)),
  openModal: (modal, props) => dispatch(doOpenModal(modal, props)),
  doChannelMute: (channelUri) => dispatch(doChannelMute(channelUri)),
  doChannelUnmute: (channelUri) => dispatch(doChannelUnmute(channelUri)),
  doCommentModBlock: (channelUri) => dispatch(doCommentModBlock(channelUri)),
  doCommentModUnBlock: (channelUri) => dispatch(doCommentModUnBlock(channelUri)),
  doCommentModBlockAsAdmin: (a, b, c) => dispatch(doCommentModBlockAsAdmin(a, b, c)),
  doCommentModUnBlockAsAdmin: (commenterUri, blockerId) =>
    dispatch(doCommentModUnBlockAsAdmin(commenterUri, blockerId)),
  doChannelSubscribe: (subscription) => dispatch(doChannelSubscribe(subscription)),
  doChannelUnsubscribe: (subscription) => dispatch(doChannelUnsubscribe(subscription)),
  doCollectionEdit: (collection, props) => dispatch(doCollectionEdit(collection, props)),
  fetchCollectionItems: (collectionId) => dispatch(doFetchItemsInCollection({ collectionId })),
  doToggleShuffleList: (params) => dispatch(doToggleShuffleList(params)),
  doRemovePersonalRecommendation: (uri) => dispatch(doRemovePersonalRecommendation(uri)),
});

export default connect(select, perform)(ClaimPreview);
