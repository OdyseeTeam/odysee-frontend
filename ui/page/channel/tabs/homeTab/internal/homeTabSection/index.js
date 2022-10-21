import { connect } from 'react-redux';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectMyClaimsPage } from 'redux/selectors/claims';
import { doFetchClaimListMine, doCheckPendingClaims } from 'redux/actions/claims';
import { doClaimSearch, doResolveClaimIds, doResolveUris } from 'redux/actions/claims';
import { createNormalizedClaimSearchKey } from 'util/claim';
import {
  selectById,
  selectClaimsByUri,
  selectClaimSearchByQuery,
  selectClaimSearchByQueryLastPageReached,
  selectFetchingClaimSearch,
  selectFetchingClaimSearchByQuery,
} from 'redux/selectors/claims';

import { withRouter } from 'react-router';
import HomeTabSection from './view';

const select = (state, props) => {
  let options: ClaimSearchOptions = {
    page_size: 1,
    page: 1,
    channel_ids: ['d336d22d3a5e370dc7dea1b9dbc2713ab1683891'],
    // name,
    // claim_type: claimType || ['stream', 'repost', 'channel'],
    no_totals: true,
    // not_channel_ids: isChannel ? undefined : mutedAndBlockedChannelIds,
    // not_tags: CsOptions.not_tags(notTags, showNsfw, hideMembersOnly),
    // order_by: resolveOrderByOption(orderParam, sortByParam),
  };
  const searchKey = createNormalizedClaimSearchKey(options);
  return {
    fetchingClaimSearch: selectFetchingClaimSearchByQuery(state)[searchKey],
    claimSearchResults: selectClaimSearchByQuery(state),
    // urls: selectMyClaimsPage(state),
    optionsStringified: JSON.stringify(options),
  };
};

const perform = (dispatch) => ({
  /*
  fetchClaimListMine: (page, pageSize, resolve, filterBy) =>
    dispatch(doFetchClaimListMine(page, pageSize, resolve, filterBy)),
  */
  doClaimSearch,
});

export default withRouter(connect(select, perform)(HomeTabSection));
