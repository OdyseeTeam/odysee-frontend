import { connect } from 'react-redux';

import { selectClaimForUri } from 'redux/selectors/claims';
import { doAllowAgeRestrictedContent } from 'redux/actions/claims';

import AgeRestricedContentOverlay from './view';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);

  return {
    claimId: claim.claim_id,
  };
};

const perform = (dispatch) => ({
  doAllowAgeRestrictedContent: (id) => dispatch(doAllowAgeRestrictedContent(id)),
});

export default connect(select, perform)(AgeRestricedContentOverlay);
