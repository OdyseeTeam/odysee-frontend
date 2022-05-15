import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import WatchHistoryPage from './view';
import { selectHistory, selectHistoryPageCount, makeSelectHistoryForPage } from 'redux/selectors/content';
import { doClearContentHistoryAll } from 'redux/actions/content';

const select = (state, props) => {
  const { search } = props.location;
  const urlParams = new URLSearchParams(search);
  const page = Number(urlParams.get('page')) || 0;

  return {
    history: selectHistory(state),
    page,
    pageCount: selectHistoryPageCount(state),
    historyItems: makeSelectHistoryForPage(page)(state),
  };
};

const perform = (dispatch) => ({
  doClearContentHistoryAll: () => dispatch(doClearContentHistoryAll()),
});

export default withRouter(connect(select, perform)(WatchHistoryPage));
