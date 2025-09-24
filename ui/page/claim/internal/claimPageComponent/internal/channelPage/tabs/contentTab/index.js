import { connect } from 'react-redux';
import { PAGE_SIZE } from 'constants/claim';
import {
  makeSelectClaimsInChannelForPage,
  makeSelectFetchingChannelClaims,
  selectClaimIsMine,
  makeSelectTotalPagesInChannelSearch,
  selectClaimForUri,
} from 'redux/selectors/claims';
import { doResolveUris } from 'redux/actions/claims';
import * as SETTINGS from 'constants/settings';
import { makeSelectChannelIsMuted } from 'redux/selectors/blocked';
import { withRouter } from 'react-router';
import { selectClientSetting, selectShowMatureContent } from 'redux/selectors/settings';
import { selectAdBlockerFound } from 'redux/selectors/app';
import { selectActiveLivestreamForChannel } from 'redux/selectors/livestream';
import { getChannelIdFromClaim } from 'util/claim';
import ContentTab from './view';

const select = (state, props) => {
  const { search } = props.location;
  const urlParams = new URLSearchParams(search);
  const page = urlParams.get('page') || 0;
  const claim = props.uri && selectClaimForUri(state, props.uri);
  const channelClaimId = getChannelIdFromClaim(claim);

  const viewParam = urlParams.get('view');
  const isShorts = viewParam === 'shorts';

  return {
    pageOfClaimsInChannel: makeSelectClaimsInChannelForPage(props.uri, page)(state),
    fetching: makeSelectFetchingChannelClaims(props.uri)(state),
    totalPages: makeSelectTotalPagesInChannelSearch(props.uri, PAGE_SIZE)(state),
    channelIsMine: selectClaimIsMine(state, claim),
    channelIsBlocked: makeSelectChannelIsMuted(props.uri)(state),
    claim,
    showMature: selectShowMatureContent(state),
    tileLayout: selectClientSetting(state, SETTINGS.TILE_LAYOUT),
    hideShorts: selectClientSetting(state, SETTINGS.HIDE_SHORTS),
    activeLivestreamForChannel: selectActiveLivestreamForChannel(state, channelClaimId),
    adBlockerFound: selectAdBlockerFound(state),
    shortsOnly: props.shortsOnly || isShorts,
  };
};

const perform = {
  doResolveUris,
};

export default withRouter(connect(select, perform)(ContentTab));
