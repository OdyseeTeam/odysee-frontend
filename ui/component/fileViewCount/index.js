import { connect } from 'react-redux';
import { selectClaimIdForUri, selectIsStreamPlaceholderForUri } from 'redux/selectors/claims';
import { selectViewersForId, selectIsActiveLivestreamForUri } from 'redux/selectors/livestream';
import { selectLanguage } from 'redux/selectors/settings';
import { doFetchViewCount, selectViewCountForUri } from 'lbryinc';
import FileViewCount from './view';

const select = (state, props) => {
  const { uri } = props;
  const claimId = selectClaimIdForUri(state, uri);

  const isLivestreamClaim = selectIsStreamPlaceholderForUri(state, uri);

  return {
    claimId,
    viewCount: selectViewCountForUri(state, uri),
    activeViewers: isLivestreamClaim && claimId ? selectViewersForId(state, claimId) : undefined,
    lang: selectLanguage(state),
    isLivestreamClaim,
    isLivestreamActive: isLivestreamClaim && selectIsActiveLivestreamForUri(state, uri),
  };
};

const perform = (dispatch) => ({
  fetchViewCount: (claimId) => dispatch(doFetchViewCount(claimId)),
});

export default connect(select, perform)(FileViewCount);
