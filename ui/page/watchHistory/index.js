// @flow
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import type { Props } from './view';
import WatchHistoryPage from './view';
import { selectWatchHistoryUris } from 'redux/selectors/content';
import { doOpenModal } from 'redux/actions/app';
import { doClearContentHistoryAll } from 'redux/actions/content';
import { doResolveUris } from 'redux/actions/claims';

const select = (state) => ({
  historyUris: selectWatchHistoryUris(state),
});

const perform = {
  doClearContentHistoryAll,
  doResolveUris,
  doOpenModal,
};

export default withRouter(connect<_, Props, _, _, _, _>(select, perform)(WatchHistoryPage));
