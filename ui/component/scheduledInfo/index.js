import { connect } from 'react-redux';
import ScheduledInfo from './view';

import { selectIsLivestreamClaimForUri, selectMomentReleaseTimeForUri } from 'redux/selectors/claims';

const select = (state, props) => {
  const { uri } = props;
  const releaseTime = selectMomentReleaseTimeForUri(state, uri);

  return {
    releaseTimeMs: releaseTime ? releaseTime.unix() * 1000 : 0,
    isLivestream: selectIsLivestreamClaimForUri(state, uri),
  };
};

export default connect(select)(ScheduledInfo);
