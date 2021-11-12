import { connect } from 'react-redux';
import { makeSelectClaimForUri } from 'redux/selectors/claims';
import ScheduledLiveStreams from './view';

const select = (state, props) => ({
  channelClaim: makeSelectClaimForUri(props.uri)(state),
});

const perform = {};

export default connect(select, perform)(ScheduledLiveStreams);
