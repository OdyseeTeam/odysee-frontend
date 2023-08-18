import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doSpendEverything, doSendCreditsToOdysee } from 'redux/actions/wallet';
import { doUserFetch, doUserDeleteAccount } from 'redux/actions/user';
import { selectTotalBalance } from 'redux/selectors/wallet';
import { selectUser } from 'redux/selectors/user';
import ModalRemoveAccount from './view';

const select = (state) => ({
  totalBalance: selectTotalBalance(state),
  user: selectUser(state),
});

const perform = {
  doHideModal,
  doUserFetch,
  doSpendEverything,
  doUserDeleteAccount,
  doSendCreditsToOdysee,
};

export default connect(select, perform)(ModalRemoveAccount);
