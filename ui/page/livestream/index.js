import { connect } from 'react-redux';
import { makeSelectTagInClaimOrChannelForUri, selectClaimForUri } from 'redux/selectors/claims';
import { doSetPlayingUri } from 'redux/actions/content';
import { doUserSetReferrer } from 'redux/actions/user';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { DISABLE_COMMENTS_TAG } from 'constants/tags';
import { doCommentSocketConnect, doCommentSocketDisconnect } from 'redux/actions/websocket';
import { getChannelIdFromClaim } from 'util/claim';
import { selectCurrentlyLiveClaim, selectFetchedActiveLivestream } from 'redux/selectors/livestream';
import { doFetchActiveLivestream } from 'redux/actions/livestream';
import LivestreamPage from './view';

const select = (state, props) => ({
  isAuthenticated: selectUserVerifiedEmail(state),
  channelClaimId: getChannelIdFromClaim(selectClaimForUri(state, props.uri)),
  chatDisabled: makeSelectTagInClaimOrChannelForUri(props.uri, DISABLE_COMMENTS_TAG)(state),
  currentlyLiveClaim: selectCurrentlyLiveClaim(state),
  fetchedActiveLiveStream: selectFetchedActiveLivestream(state),
});

const perform = (dispatch) => ({
  doSetPlayingUri,
  doUserSetReferrer,
  doCommentSocketConnect,
  doCommentSocketDisconnect,
  doFetchActiveLivestream: (channelID) => dispatch(doFetchActiveLivestream(channelID)),
});

export default connect(select, perform)(LivestreamPage);
