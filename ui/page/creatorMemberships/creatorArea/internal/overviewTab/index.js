import { connect } from 'react-redux';

import { selectMyChannelClaims } from 'redux/selectors/claims';
import { doSetActiveChannel } from 'redux/actions/app';

import OverviewTab from './view';

const select = (state, props) => ({
  myChannelClaims: selectMyChannelClaims(state),
});

const perform = {
  doSetActiveChannel,
};

export default connect(select, perform)(OverviewTab);
