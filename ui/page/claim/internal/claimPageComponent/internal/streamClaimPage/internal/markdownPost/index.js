import { connect } from 'react-redux';

import { selectClaimIsNsfwForUri, selectClaimForUri } from 'redux/selectors/claims';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';

import MarkdownPostPage from './view';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);

  const claimId = claim.claim_id;

  return {
    isMature: selectClaimIsNsfwForUri(state, uri),
    contentUnlocked: claimId && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId),
  };
};

export default connect(select)(MarkdownPostPage);
