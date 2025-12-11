import VRPage from './view';
import { connect } from 'react-redux';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectStreamingUrlForUri } from 'redux/selectors/file_info';

const select = (state, props) => {
  const { uri } = props.match.params;

  return {
    claim: uri ? selectClaimForUri(state, uri) : null,
    streamingUrl: uri ? selectStreamingUrlForUri(state, uri) : null,
  };
};

const perform = {};

export default connect(select, perform)(VRPage);
