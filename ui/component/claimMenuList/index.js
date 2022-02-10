import { connect } from 'react-redux';
import { selectClaimForUri, selectClaimIsMine } from 'redux/selectors/claims';
import { doCollectionEdit, doFetchItemsInCollection } from 'redux/actions/collections';
import { doEditForChannel } from 'redux/actions/publish';
import {
  makeSelectCollectionForIdHasClaimUrl,
  makeSelectCollectionIsMine,
  makeSelectEditedCollectionForId,
  makeSelectUrlsForCollectionId,
} from 'redux/selectors/collections';
import { makeSelectFileInfoForUri } from 'redux/selectors/file_info';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { selectChannelIsMuted } from 'redux/selectors/blocked';
import { doToggleMuteChannel } from 'redux/actions/blocked';
import { doOpenModal } from 'redux/actions/app';
import { doToggleBlockChannel, doToggleBlockChannelAsAdmin } from 'redux/actions/comments';
import { selectHasAdminChannel, selectChannelIsBlocked, selectChannelIsAdminBlocked } from 'redux/selectors/comments';
import { doToast } from 'redux/actions/notifications';
import { doToggleSubscription } from 'redux/actions/subscriptions';
import { selectIsSubscribedForUri } from 'redux/selectors/subscriptions';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { selectListShuffle } from 'redux/selectors/content';
import { doToggleLoopList, doToggleShuffleList } from 'redux/actions/content';
import ClaimPreview from './view';
import fs from 'fs';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri, false); // @KP test no repost!
  const collectionId = props.collectionId;
  const repostedClaim = claim && claim.reposted_claim;
  const contentClaim = repostedClaim || claim;
  const contentSigningChannel = contentClaim && contentClaim.signing_channel;
  const contentPermanentUri = contentClaim && contentClaim.permanent_url;
  const contentChannelUri = (contentSigningChannel && contentSigningChannel.permanent_url) || contentPermanentUri;
  const shuffleList = selectListShuffle(state);
  const shuffle = shuffleList && shuffleList.collectionId === collectionId && shuffleList.newUrls;
  const playNextUri = shuffle && shuffle[0];

  return {
    claim,
    repostedClaim,
    contentClaim,
    contentSigningChannel,
    contentChannelUri,
    claimIsMine: selectClaimIsMine(state, claim),
    hasClaimInWatchLater: makeSelectCollectionForIdHasClaimUrl(
      COLLECTIONS_CONSTS.WATCH_LATER_ID,
      contentPermanentUri
    )(state),
    hasClaimInFavorites: makeSelectCollectionForIdHasClaimUrl(
      COLLECTIONS_CONSTS.FAVORITES_ID,
      contentPermanentUri
    )(state),
    channelIsMuted: selectChannelIsMuted(state, contentChannelUri),
    channelIsBlocked: selectChannelIsBlocked(state, contentChannelUri),
    fileInfo: makeSelectFileInfoForUri(contentPermanentUri)(state),
    isSubscribed: selectIsSubscribedForUri(state, contentChannelUri),
    channelIsAdminBlocked: selectChannelIsAdminBlocked(state, props.uri),
    isAdmin: selectHasAdminChannel(state),
    claimInCollection: makeSelectCollectionForIdHasClaimUrl(collectionId, contentPermanentUri)(state),
    isMyCollection: makeSelectCollectionIsMine(collectionId)(state),
    editedCollection: makeSelectEditedCollectionForId(collectionId)(state),
    isAuthenticated: Boolean(selectUserVerifiedEmail(state)),
    resolvedList: makeSelectUrlsForCollectionId(collectionId)(state),
    playNextUri,
  };
};

const perform = (dispatch) => ({
  prepareEdit: (publishData, uri, fileInfo) => doEditForChannel(publishData, uri, fileInfo, fs),
  doToast: (props) => dispatch(doToast(props)),
  openModal: (modal, props) => dispatch(doOpenModal(modal, props)),
  toggleMute: (channelUri) => dispatch(doToggleMuteChannel(channelUri)),
  toggleModBlock: (channelUri) => dispatch(doToggleBlockChannel(channelUri)),
  toggleAdminBlock: (channelUri) => dispatch(doToggleBlockChannelAsAdmin(channelUri)),
  toggleSubscribe: (subscription) => dispatch(doToggleSubscription(subscription)),
  doCollectionEdit: (collection, props) => dispatch(doCollectionEdit(collection, props)),
  fetchCollectionItems: (collectionId) => dispatch(doFetchItemsInCollection({ collectionId })),
  doToggleShuffleList: (collectionId) => {
    dispatch(doToggleLoopList(collectionId, false, true));
    dispatch(doToggleShuffleList(undefined, collectionId, true, true));
  },
});

export default connect(select, perform)(ClaimPreview);
