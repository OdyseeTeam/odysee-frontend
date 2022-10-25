import { connect } from 'react-redux';
import { selectClaimForUri, selectClaimSearchByQuery, makeSelectFetchingChannelClaims } from 'redux/selectors/claims';
import { doResolveUris } from 'redux/actions/claims';
import { withRouter } from 'react-router';
import { doFetchChannelLiveStatus } from 'redux/actions/livestream';
import {} from 'redux/selectors/claims';
import { selectActiveLivestreamForChannel, selectActiveLivestreamInitialized } from 'redux/selectors/livestream';
import HomeTab from './view';

const select = (state, props) => {
  const claim = props.uri && selectClaimForUri(state, props.uri);
  // const fetching = makeSelectFetchingChannelClaims(props.uri)(state);

  return {
    claimSearchByQuery: selectClaimSearchByQuery(state),
    activeLivestreamForChannel: selectActiveLivestreamForChannel(state, claim.claim_id),
    activeLivestreamInitialized: selectActiveLivestreamInitialized(state),
    claim,
  };
};

const perform = (dispatch) => ({
  doResolveUris: (uris, returnCachedUris) => dispatch(doResolveUris(uris, returnCachedUris)),
  doFetchChannelLiveStatus: (channelID) => dispatch(doFetchChannelLiveStatus(channelID)),
  // doFetchCollectionUrls: (collectionId) => dispatch(selectUrlsForCollectionId(collectionId)),
});

export default withRouter(connect(select, perform)(HomeTab));
