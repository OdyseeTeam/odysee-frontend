import { connect } from 'react-redux';

import { selectMomentReleaseTimeForUri } from 'redux/selectors/claims';

import LivestreamScheduledInfo from './view';

const select = (state, props) => {
  const { uri } = props;

  const releaseTime = selectMomentReleaseTimeForUri(state, uri);

  return {
    releaseTimeMs: releaseTime ? releaseTime.unix() * 1000 : 0,
  };
};

export default connect(select)(LivestreamScheduledInfo);
