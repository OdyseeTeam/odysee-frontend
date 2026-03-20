import { connect } from 'react-redux';
import { selectClaimForUri } from 'redux/selectors/claims';
import ClaimEffectiveAmount from './view';

const select = (state, props) => ({
  claim: selectClaimForUri(state, props.uri, true),
});

export default connect(select)(ClaimEffectiveAmount);
