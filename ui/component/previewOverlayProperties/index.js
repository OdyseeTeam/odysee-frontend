import { connect } from 'react-redux';
import { SCHEDULED_TAGS } from 'constants/tags';
import {
  selectClaimIsMine,
  selectClaimForUri,
  selectIsStreamPlaceholderForUri,
  selectIsUriUnlisted,
} from 'redux/selectors/claims';
import { selectIsActiveLivestreamForUri, selectViewersForId } from 'redux/selectors/livestream';
import { makeSelectFilePartlyDownloaded } from 'redux/selectors/file_info';
import { selectCollectionHasEditsForId } from 'redux/selectors/collections';
import { claimContainsTag } from 'util/claim';
import PreviewOverlayProperties from './view';

const select = (state, props) => {
  const { uri } = props;

  const claim = selectClaimForUri(state, uri);
  const claimId = claim && claim.claim_id;

  const isLivestreamClaim = selectIsStreamPlaceholderForUri(state, uri);

  return {
    claim,
    hasEdits: selectCollectionHasEditsForId(state, claimId),
    downloaded: makeSelectFilePartlyDownloaded(uri)(state),
    claimIsMine: selectClaimIsMine(state, claim),
    isLivestream: isLivestreamClaim,
    isLivestreamActive: isLivestreamClaim && selectIsActiveLivestreamForUri(state, uri),
    isLivestreamScheduled: claimContainsTag(claim, SCHEDULED_TAGS.LIVE),
    isUnlisted: selectIsUriUnlisted(state, uri),
    livestreamViewerCount: isLivestreamClaim ? selectViewersForId(state, claim.claim_id) : undefined,
  };
};

export default connect(select, null)(PreviewOverlayProperties);
