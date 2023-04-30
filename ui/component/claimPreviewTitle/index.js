import { connect } from 'react-redux';
import { selectTitleForUri, selectClaimForUri } from 'redux/selectors/claims';
import ClaimPreviewTitle from './view';

const select = (state, props) => ({
  claim: selectClaimForUri(state, props.uri, false),
  title: selectTitleForUri(state, props.uri),
});

export default connect(select)(ClaimPreviewTitle);
