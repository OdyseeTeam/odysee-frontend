// @flow
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import type { Props } from './view';
import WatchHistoryPage from './view';
import { selectWatchHistoryUris, selectFetchingRemoteHistory } from 'redux/selectors/content';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { doOpenModal } from 'redux/actions/app';
import { doClearContentHistoryAll, doFetchViewHistory, doDeleteRemoteViewHistory } from 'redux/actions/content';
import { doResolveUris } from 'redux/actions/claims';

const select = (state) => ({
  historyUris: selectWatchHistoryUris(state),
  fetchingRemoteHistory: selectFetchingRemoteHistory(state),
  isAuthenticated: selectUserVerifiedEmail(state),
});

const perform = {
  doClearContentHistoryAll,
  doFetchViewHistory,
  doDeleteRemoteViewHistory,
  doResolveUris,
  doOpenModal,
};

export default withRouter(connect<_, Props, _, _, _, _>(select, perform)(WatchHistoryPage));
