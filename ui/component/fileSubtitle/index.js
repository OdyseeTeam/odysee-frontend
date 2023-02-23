import { connect } from 'react-redux';
import { selectClaimForUri, selectIsStreamPlaceholderForUri } from 'redux/selectors/claims';
import { selectShouldShowLivestreamForUri } from 'redux/selectors/livestream';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';

import FileSubtitle from './view';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri);

  return {
    contentUnlocked: claim && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claim.claim_id),
    isLivestreamClaim: selectIsStreamPlaceholderForUri(state, uri),
    isLive: selectShouldShowLivestreamForUri(state, uri),
  };
};

export default connect(select)(FileSubtitle);
