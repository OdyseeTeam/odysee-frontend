import { connect } from 'react-redux';
import { selectClaimIsMine, selectClaimForUri, selectUnlistedContentTag, selectPrivateContentTag, selectScheduledContentTag } from 'redux/selectors/claims';
import { makeSelectFilePartlyDownloaded } from 'redux/selectors/file_info';
import { selectCollectionHasEditsForId } from 'redux/selectors/collections';
import PreviewOverlayProperties from './view';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const claimId = claim && claim.claim_id;

  return {
    claim,
    hasEdits: selectCollectionHasEditsForId(state, claimId),
    downloaded: makeSelectFilePartlyDownloaded(props.uri)(state),
    claimIsMine: selectClaimIsMine(state, claim),
    isUnlistedContent: Boolean(selectUnlistedContentTag(state, props.uri)),
    isPrivateContent: Boolean(selectPrivateContentTag(state, props.uri)),
    isScheduledContent: Boolean(selectScheduledContentTag(state, props.uri)),
  };
};

export default connect(select, null)(PreviewOverlayProperties);
