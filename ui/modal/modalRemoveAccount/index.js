import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { doUserDeleteAccount } from 'redux/actions/user';
import { doSpentEverything, doSendCreditsToOdysee } from 'redux/actions/wallet';
import { doUserFetch } from 'redux/actions/user';
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
  doSpentEverything,
  doUserDeleteAccount,
  doSendCreditsToOdysee,
};

export default connect(select, perform)(ModalRemoveAccount);
