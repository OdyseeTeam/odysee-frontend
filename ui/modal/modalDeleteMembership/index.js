import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';
import { selectTransactionItems } from 'redux/selectors/wallet';
import { doToast } from 'redux/actions/notifications';
import ModalRemoveCard from './view';

const select = (state) => ({
  transactionItems: selectTransactionItems(state),
});

const perform = (dispatch) => ({
  toast: (message, isError) => dispatch(doToast({ message, isError })),
  closeModal: () => dispatch(doHideModal()),
});

export default connect(select, perform)(ModalRemoveCard);
