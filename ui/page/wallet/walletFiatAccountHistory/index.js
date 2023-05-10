import { connect } from 'react-redux';
import WalletFiatAccountHistory from './view';
import { doListAccountTransactions } from 'redux/actions/stripe';
import { selectAccountTransactions } from 'redux/selectors/stripe';

const select = (state) => ({
  incomingHistory: selectAccountTransactions(state),
});

const perform = {
  doListAccountTransactions,
};

export default connect(select, perform)(WalletFiatAccountHistory);
