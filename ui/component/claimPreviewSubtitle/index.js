import * as PAGES from 'constants/pages';
import { connect } from 'react-redux';
import { selectClaimForUri, makeSelectClaimIsPending, isStreamPlaceholderClaim } from 'redux/selectors/claims';
import { doClearPublish, doPrepareEdit } from 'redux/actions/publish';
import { push } from 'connected-react-router';
import ClaimPreviewSubtitle from './view';
import { doFetchSubCount, selectSubCountForUri } from 'lbryinc';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const isChannel = claim && claim.value_type === 'channel';
  const isLivestream = isStreamPlaceholderClaim(claim);
  return {
    claim,
    pending: makeSelectClaimIsPending(props.uri)(state),
    isLivestream,
    subCount: isChannel ? selectSubCountForUri(state, claim.repost_url ? claim.canonical_url : props.uri) : 0,
  };
};

const perform = (dispatch) => ({
  beginPublish: (name) => {
    dispatch(doClearPublish());
    dispatch(doPrepareEdit({ name }));
    dispatch(push(`/$/${PAGES.UPLOAD}`));
  },
  fetchSubCount: (claimId) => dispatch(doFetchSubCount(claimId)),
});

export default connect(select, perform)(ClaimPreviewSubtitle);
