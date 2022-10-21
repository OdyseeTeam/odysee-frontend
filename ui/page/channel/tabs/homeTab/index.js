import { connect } from 'react-redux';
import { PAGE_SIZE } from 'constants/claim';
import {
  makeSelectClaimsInChannelForPage,
  makeSelectFetchingChannelClaims,
  selectClaimIsMine,
  makeSelectTotalPagesInChannelSearch,
  selectClaimForUri,
} from 'redux/selectors/claims';
import { selectUserHasOdyseePremiumPlus } from 'redux/selectors/memberships';
import { doResolveUris } from 'redux/actions/claims';
import * as SETTINGS from 'constants/settings';
import { makeSelectChannelIsMuted } from 'redux/selectors/blocked';
import { withRouter } from 'react-router';
import { doFetchChannelLiveStatus } from 'redux/actions/livestream';
import { selectClaimSearchByQuery } from 'redux/selectors/claims';
import HomeTab from './view';

const select = (state, props) => {
  const { search } = props.location;
  // const urlParams = new URLSearchParams(search);
  const claim = props.uri && selectClaimForUri(state, props.uri);

  return {
    claimSearchByQuery: selectClaimSearchByQuery(state),

    // pageOfClaimsInChannel: makeSelectClaimsInChannelForPage(props.uri, page)(state),
    claim,
  };
};

const perform = (dispatch) => ({
  doResolveUris: (uris, returnCachedUris) => dispatch(doResolveUris(uris, returnCachedUris)),
  doFetchChannelLiveStatus: (channelID) => dispatch(doFetchChannelLiveStatus(channelID)),
  // doFetchCollectionUrls: (collectionId) => dispatch(selectUrlsForCollectionId(collectionId)),
});

export default withRouter(connect(select, perform)(HomeTab));
