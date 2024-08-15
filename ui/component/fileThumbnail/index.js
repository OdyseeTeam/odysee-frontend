import { connect } from 'react-redux';
import { doResolveUri } from 'redux/actions/claims';
import {
  selectHasResolvedClaimForUri,
  selectThumbnailForUri,
  makeSelectTagInClaimOrChannelForUri,
  selectIsAgeRestrictedContentAllowedForClaimId,
  selectClaimForUri,
  selectClaimIsMine,
} from 'redux/selectors/claims';
import CardMedia from './view';

import { OVER_18_CONTENT_TAG } from 'constants/tags';

const select = (state, props) => {
  const { uri, secondaryUri } = props;

  const claim = selectClaimForUri(state, uri);
  const { claim_id: claimId } = claim || {};

  return {
    hasResolvedClaim: uri ? selectHasResolvedClaimForUri(state, uri) : undefined,
    thumbnailFromClaim: selectThumbnailForUri(state, uri),
    thumbnailFromSecondaryClaim: selectThumbnailForUri(state, secondaryUri, true),
    isAgeRestricted: makeSelectTagInClaimOrChannelForUri(props.uri, OVER_18_CONTENT_TAG)(state),
    isAgeRestrictedContentAllowed: selectIsAgeRestrictedContentAllowedForClaimId(state, claimId),
    claimIsMine: Boolean(selectClaimIsMine(state, claim)),
  };
};

const perform = {
  doResolveUri,
};

export default connect(select, perform)(CardMedia);
