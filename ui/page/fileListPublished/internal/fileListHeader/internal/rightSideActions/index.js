import { connect } from 'react-redux';
import { doClearClaimSearch, doFetchClaimListMine } from 'redux/actions/claims';
import RightSideActions from './view';

const perform = {
  doClearClaimSearch,
  fetchClaimListMine: doFetchClaimListMine,
};

export default connect(null, perform)(RightSideActions);
