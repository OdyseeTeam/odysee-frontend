import { connect } from 'react-redux';
import { doOpenCancelationModalForMembership } from 'redux/actions/memberships';

import PremiumOption from './view';

const select = (state, props) => ({});

const perform = {
  doOpenCancelationModalForMembership,
};

export default connect(select, perform)(PremiumOption);
