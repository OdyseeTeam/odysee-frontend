import { connect } from 'react-redux';
import { doFetchClaimListMine } from 'redux/actions/claims';
import RightSideActions from './view';

const perform = {
  fetchClaimListMine: doFetchClaimListMine,
};

export default connect(null, perform)(RightSideActions);
