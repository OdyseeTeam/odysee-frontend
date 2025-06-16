import { connect } from 'react-redux';
import Overview from './view';
import { doArSend } from 'redux/actions/arwallet';
import { selectAPIArweaveDefaultAccount, selectArAccountUpdating, selectArweaveAccountForAddress } from 'redux/selectors/stripe';
import { doUpdateArweaveAddressStatus } from 'redux/actions/stripe';

const select = (state, props) => {
  const { wallet } = props;
  return {
    account: selectArweaveAccountForAddress(state, wallet?.address),
    accountUpdating: selectArAccountUpdating(state),
    defaultAccount: selectAPIArweaveDefaultAccount(state),
  };
};

const perform = (dispatch) => ({
  doUpdateArweaveAddressStatus,
  doArSend: (recipientAddress, amountAr) => dispatch(doArSend(recipientAddress, amountAr)),
});

export default connect(select, perform)(Overview);
