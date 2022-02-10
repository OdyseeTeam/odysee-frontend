import { connect } from 'react-redux';
import { selectClaimForUri, selectClaimIsMine } from 'redux/selectors/claims';
import { doCollectionEdit } from 'redux/actions/collections';
import { doEditForChannel } from 'redux/actions/publish';
import { makeSelectCollectionForIdHasClaimUrl, makeSelectCollectionIsMine } from 'redux/selectors/collections';
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
import { getChannelPermanentUrlFromClaim } from 'util/claim';
import ClaimPreview from './view';

const select = (state, props) => {
  const { uri } = props;

  const genericClaim = selectClaimForUri(state, uri, false);

  const { reposted_claim } = genericClaim || {};
  const claim = reposted_claim || genericClaim;
  const permanentUrl = claim && claim.permanent_url;
  const channelUrl = getChannelPermanentUrlFromClaim(claim);
  const collectionClaimId = claim && claim.value_type === 'collection' && claim.claim_id;

  return {
    claim: genericClaim,
    claimIsMine: selectClaimIsMine(state, genericClaim),
    hasClaimInWatchLater: makeSelectCollectionForIdHasClaimUrl(COLLECTIONS_CONSTS.WATCH_LATER_ID, permanentUrl)(state),
    hasClaimInFavorites: makeSelectCollectionForIdHasClaimUrl(COLLECTIONS_CONSTS.FAVORITES_ID, permanentUrl)(state),
    channelIsMuted: selectChannelIsMuted(state, channelUrl),
    channelIsBlocked: selectChannelIsBlocked(state, channelUrl),
    isSubscribed: selectIsSubscribedForUri(state, channelUrl),
    channelIsAdminBlocked: selectChannelIsAdminBlocked(state, channelUrl),
    isAdmin: selectHasAdminChannel(state),
    isMyCollection: makeSelectCollectionIsMine(collectionClaimId)(state),
    isAuthenticated: Boolean(selectUserVerifiedEmail(state)),
  };
};

const perform = {
  doCollectionEdit,
  doOpenModal,
  doEditForChannel,
  doToast,
  doToggleBlockChannel,
  doToggleBlockChannelAsAdmin,
  doToggleMuteChannel,
  doToggleSubscription,
};

export default connect(select, perform)(ClaimPreview);
