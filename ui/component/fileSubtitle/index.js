import { connect } from 'react-redux';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectIsProtectedContentLockedFromUserForId } from 'redux/selectors/memberships';

import FileSubtitle from './view';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri);

  return {
    contentRestrictedFromUser: claim && selectIsProtectedContentLockedFromUserForId(state, claim.claim_id),
  };
};

export default connect(select)(FileSubtitle);
