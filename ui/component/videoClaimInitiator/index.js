import { connect } from 'react-redux';

import { doSetMainPlayerDimension } from 'redux/actions/app';

import withStreamClaimRender from 'hocs/withStreamClaimRender';

import VideoClaimInitiator from './view';

const perform = {
  doSetMainPlayerDimension,
};

export default withStreamClaimRender(connect(null, perform)(VideoClaimInitiator));
