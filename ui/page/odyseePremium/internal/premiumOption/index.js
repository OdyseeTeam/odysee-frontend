import { connect } from 'react-redux';
import { doOpenModal } from 'redux/actions/app';
import { selectPreferredCurrency } from 'redux/selectors/settings';

import PremiumOption from './view';

const select = (state) => ({
  preferredCurrency: selectPreferredCurrency(state),
});

const perform = {
  doOpenModal,
};

export default connect(select, perform)(PremiumOption);
