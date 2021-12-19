import { connect } from 'react-redux';
import { selectSubscriptions } from 'redux/selectors/subscriptions';
import { doFetchActiveLivestreams } from 'redux/actions/livestream';
import { selectActiveLivestreams, selectFetchingActiveLivestreams } from 'redux/selectors/livestream';
import CalendarPage from './view';

const select = (state) => ({
  subscribedChannels: selectSubscriptions(state),
  activeLivestreams: selectActiveLivestreams(state),
  fetchingActiveLivestreams: selectFetchingActiveLivestreams(state),
});

const perform = (dispatch) => ({
  doFetchActiveLivestreams: () => dispatch(doFetchActiveLivestreams()),
});

export default connect(select, perform)(CalendarPage);
