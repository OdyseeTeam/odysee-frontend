import { connect } from 'react-redux';
import { doClearClaimSearch, doFetchClaimListMine } from 'redux/actions/claims';
import ClaimListHeader from './view';

const perform = {
  doClearClaimSearch,
  fetchClaimListMine: doFetchClaimListMine,
};

export default connect(null, perform)(ClaimListHeader);
