import LivestreamList from './view';
import { connect } from 'react-redux';
import { doFetchAllActiveLivestreamsForQuery } from 'redux/actions/livestream';
import { selectFilteredActiveLivestreamUris, selectIsFetchingActiveLivestreams } from 'redux/selectors/livestream';

const select = (state) => ({
  activeLivestreamUris: selectFilteredActiveLivestreamUris(state),
  fetchingActiveLivestreams: selectIsFetchingActiveLivestreams(state),
});

const perform = {
  doFetchAllActiveLivestreamsForQuery,
};

export default connect(select, perform)(LivestreamList);
