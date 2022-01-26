import { connect } from 'react-redux';
import { doFetchPersonalRecommendations } from 'redux/actions/search';
import { selectPersonalRecommendations } from 'redux/selectors/search';

import RecommendedPersonal from './view';

const select = (state) => ({
  personalRecommendations: selectPersonalRecommendations(state),
});

const perform = {
  doFetchPersonalRecommendations,
};

export default connect(select, perform)(RecommendedPersonal);
