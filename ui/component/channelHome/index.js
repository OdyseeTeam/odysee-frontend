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
import { selectClientSetting, selectShowMatureContent } from 'redux/selectors/settings';
import { selectAdBlockerFound } from 'redux/selectors/app';
import { doFetchChannelLiveStatus } from 'redux/actions/livestream';
import { selectActiveLivestreamForChannel, selectActiveLivestreamInitialized } from 'redux/selectors/livestream';
import { getChannelIdFromClaim } from 'util/claim';
import ChannelHome from './view';

const select = (state, props) => {
  const { search } = props.location;
  const urlParams = new URLSearchParams(search);
  const page = urlParams.get('page') || 0;
  const claim = props.uri && selectClaimForUri(state, props.uri);
  const channelClaimId = getChannelIdFromClaim(claim);

  return {
    // pageOfClaimsInChannel: makeSelectClaimsInChannelForPage(props.uri, page)(state),
    claim,
  };
};

const perform = (dispatch) => ({
  doResolveUris: (uris, returnCachedUris) => dispatch(doResolveUris(uris, returnCachedUris)),
  doFetchChannelLiveStatus: (channelID) => dispatch(doFetchChannelLiveStatus(channelID)),
});

export default withRouter(connect(select, perform)(ChannelHome));
