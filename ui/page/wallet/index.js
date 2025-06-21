import { connect } from 'react-redux';
import { selectTotalBalance } from 'redux/selectors/wallet';
import { doTipAccountStatus } from 'redux/actions/stripe';
import { doOpenModal } from 'redux/actions/app';
import Wallet from './view';

const select = (state) => ({
  totalBalance: selectTotalBalance(state),
});

const perform = {
  doOpenModal,
  doTipAccountStatus,
};

export default connect(select, perform)(Wallet);
