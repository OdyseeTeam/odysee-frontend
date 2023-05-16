// @flow
import { connect } from 'react-redux';
import type { Props } from './view';
import ClaimSearchView from './view';

import { doClaimSearch } from 'redux/actions/claims';
import { selectClaimsStates, selectClaimSearchByQuery, selectFetchingClaimSearchByQuery } from 'redux/selectors/claims';
import { createNormalizedClaimSearchKey } from 'util/claim';

const select = (state, props) => {
  const csByQuery = selectClaimSearchByQuery(state);
  const csByQueryMiscInfo = selectClaimsStates(state).claimSearchByQueryMiscInfo;
  const csIsFetchingByQuery = selectFetchingClaimSearchByQuery(state);
  const query = createNormalizedClaimSearchKey(props.csOptions);

  return {
    csResults: csByQuery[query],
    csResultsMiscInfo: csByQueryMiscInfo[query],
    isFetching: csIsFetchingByQuery[query],
  };
};

const perform = {
  doClaimSearch,
};

export default connect<_, Props, _, _, _, _>(select, perform)(ClaimSearchView);
