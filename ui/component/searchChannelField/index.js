import { connect } from 'react-redux';
import { doToast } from 'redux/actions/notifications';
import { doResolveUris } from 'redux/actions/claims';
import SearchChannelField from './view';

const perform = (dispatch) => ({
  doToast: (options) => dispatch(doToast(options)),
  doResolveUris: (uris) => dispatch(doResolveUris(uris)),
});

export default connect(null, perform)(SearchChannelField);
