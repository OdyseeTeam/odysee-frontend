import { connect } from 'react-redux';

import {
  makeSelectTagInClaimOrChannelForUri,
  selectIsAgeRestrictedContentAllowedForClaimId,
  selectClaimForUri,
  selectClaimIsMine,
} from 'redux/selectors/claims';

import { AGE_RESTRICED_CONTENT_TAG } from 'constants/tags';

import PreviewOverlayAgeRestrictedContent from './view';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri);
  const claimId = claim && claim.claim_id;

  return {
    uri,
    isAgeRestricted: makeSelectTagInClaimOrChannelForUri(uri, AGE_RESTRICED_CONTENT_TAG)(state),
    isAgeRestrictedContentAllowed: selectIsAgeRestrictedContentAllowedForClaimId(state, claimId),
    isMine: Boolean(selectClaimIsMine(state, claim)),
  };
};

export default connect(select, null)(PreviewOverlayAgeRestrictedContent);
