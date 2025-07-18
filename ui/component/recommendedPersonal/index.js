import { connect } from 'react-redux';
import { doFetchPersonalRecommendations } from 'redux/actions/search';
import { selectPersonalRecommendations } from 'redux/selectors/search';
import { hasLegacyOdyseePremium, selectUser } from 'redux/selectors/user';

import RecommendedPersonal from './view';

const select = (state) => {
  const user = selectUser(state);
  return {
    userId: user && user.id,
    personalRecommendations: selectPersonalRecommendations(state),
    userHasOdyseeMembership: hasLegacyOdyseePremium(state),
  };
};

const perform = {
  doFetchPersonalRecommendations,
};

export default connect(select, perform)(RecommendedPersonal);
