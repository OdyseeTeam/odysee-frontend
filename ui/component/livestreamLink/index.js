import { connect } from 'react-redux';

import { doResolveUri } from 'redux/actions/claims';

import LivestreamLink from './view';

const perform = {
  doResolveUri,
};

export default connect(null, perform)(LivestreamLink);
