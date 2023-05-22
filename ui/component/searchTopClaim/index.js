import { connect } from 'react-redux';
import { doBeginPublish } from 'redux/actions/publish';
import { doResolveUris } from 'redux/actions/claims';
import { doOpenModal } from 'redux/actions/app';
import { selectPendingIds, makeSelectClaimForUri } from 'redux/selectors/claims';
import { makeSelectWinningUriForQuery, selectIsResolvingWinningUri } from 'redux/selectors/search';
import SearchTopClaim from './view';

const select = (state, props) => {
  const winningUri = makeSelectWinningUriForQuery(props.query)(state);

  return {
    winningUri,
    winningClaim: winningUri ? makeSelectClaimForUri(winningUri)(state) : undefined,
    isResolvingWinningUri: props.query ? selectIsResolvingWinningUri(state, props.query) : false,
    pendingIds: selectPendingIds(state),
  };
};

const perform = (dispatch) => ({
  beginPublish: (a, b, c) => dispatch(doBeginPublish(a, b, c)),
  doResolveUris: (uris) => dispatch(doResolveUris(uris)),
  doOpenModal: (id, props) => dispatch(doOpenModal(id, props)),
});

export default connect(select, perform)(SearchTopClaim);
