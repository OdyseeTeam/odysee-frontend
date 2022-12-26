import { connect } from 'react-redux';

import { doResolveUri } from 'redux/actions/claims';

import LivestreamLink from './view';

import withLiveStatus from 'hocs/withLiveStatus';

const perform = {
  doResolveUri,
};

export default withLiveStatus(connect(null, perform)(LivestreamLink));
