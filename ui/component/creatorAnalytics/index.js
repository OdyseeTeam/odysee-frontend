import { connect } from 'react-redux';
import { makeSelectClaimForUri } from 'redux/selectors/claims';
import { doResolveUris } from 'redux/actions/claims';
import CreatorAnalytics from './view';

const select = (state, props) => ({
  claim: makeSelectClaimForUri(props.uri)(state),
});

const perform = (dispatch) => ({
  doResolveUris: (uris) => dispatch(doResolveUris(uris)),
});

export default connect(select, perform)(CreatorAnalytics);
