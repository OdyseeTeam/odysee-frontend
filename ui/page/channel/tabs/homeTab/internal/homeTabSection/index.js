import { connect } from 'react-redux';
import { doClaimSearch, doResolveClaimIds, doResolveUris } from 'redux/actions/claims';
import { createNormalizedClaimSearchKey } from 'util/claim';
import { selectClaimSearchByQuery, selectFetchingClaimSearchByQuery } from 'redux/selectors/claims';

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
    doClaimSearch,
  };
};

export default connect(select)(HomeTabSection);
