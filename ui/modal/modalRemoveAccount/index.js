import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { selectTotalBalance } from 'redux/selectors/wallet';
import { selectUser } from 'redux/selectors/user';
import { doRemoveAccountSequence } from './thunk';
import ModalRemoveAccount from './view';

const select = (state) => ({
  isPendingDeletion: selectUser(state)?.pending_deletion,
  totalBalance: selectTotalBalance(state),
});

const perform = {
  doHideModal,
  doRemoveAccountSequence,
};

export default connect(select, perform)(ModalRemoveAccount);
