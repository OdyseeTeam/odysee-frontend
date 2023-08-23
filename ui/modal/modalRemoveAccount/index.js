import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doSpendEverything, doSendCreditsToOdysee } from 'redux/actions/wallet';
import { doUserFetch, doUserDeleteAccount, doClearUserDeletionSuccess } from 'redux/actions/user';
import { selectTotalBalance } from 'redux/selectors/wallet';
import { selectUser, selectUserDeletionSuccess } from 'redux/selectors/user';
import ModalRemoveAccount from './view';

const select = (state) => ({
  user: selectUser(state),
  totalBalance: selectTotalBalance(state),
  userDeletionSuccess: selectUserDeletionSuccess(state),
});

const perform = {
  doHideModal,
  doUserFetch,
  doSpendEverything,
  doUserDeleteAccount,
  doSendCreditsToOdysee,
  doClearUserDeletionSuccess,
};

export default connect(select, perform)(ModalRemoveAccount);
