import { connect } from 'react-redux';
import WalletFiatAccountHistory from './view';
import { doListAccountTransactions } from 'redux/actions/stripe';
import { selectLanguage } from 'redux/selectors/settings';
import { selectAccountTransactions } from 'redux/selectors/stripe';

const select = (state) => ({
  appLanguage: selectLanguage(state),
  incomingHistory: selectAccountTransactions(state),
});

const perform = {
  doListAccountTransactions,
};

export default connect(select, perform)(WalletFiatAccountHistory);
