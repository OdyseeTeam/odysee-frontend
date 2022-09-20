import { connect } from 'react-redux';
import { selectHasSavedCard } from 'redux/selectors/stripe';

import JoinButton from './view';

const select = (state) => ({
  hasSavedCard: selectHasSavedCard(state),
});

export default connect(select)(JoinButton);
