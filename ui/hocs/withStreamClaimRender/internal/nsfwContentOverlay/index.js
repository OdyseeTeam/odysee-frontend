import { connect } from 'react-redux';

import { selectClaimForUri, selectClaimIsMine } from 'redux/selectors/claims';
import { doAknowledgeNsfw } from 'redux/actions/claims';

import NsfwContentOverlay from './view';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);

  return {
    claimId: claim.claim_id,
    claimIsMine: selectClaimIsMine(state, claim),
  };
};

export default connect(select, { doAknowledgeNsfw })(NsfwContentOverlay);
