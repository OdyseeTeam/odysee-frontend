import { connect } from 'react-redux';
import { selectIsStreamPlaceholderForUri, selectClaimForUri } from 'redux/selectors/claims';
import FileType from './view';

const select = (state, props) => ({
  claim: selectClaimForUri(state, props.uri),
  isLivestream: selectIsStreamPlaceholderForUri(state, props.uri),
});

export default connect(select)(FileType);
