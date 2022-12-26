import { connect } from 'react-redux';

import { selectHasSavedCard } from 'redux/selectors/stripe';
import { selectUserVerifiedEmail } from 'redux/selectors/user';

import { doOpenModal } from 'redux/actions/app';
import { doGetCustomerStatus } from 'redux/actions/stripe';

import withCreditCard from './view';

const select = (state, props) => ({
  hasSavedCard: selectHasSavedCard(state),
  isAuthenticated: selectUserVerifiedEmail(state),
});

const perform = {
  doOpenModal,
  doGetCustomerStatus,
};

export default (Component) => connect(select, perform)(withCreditCard(Component));
