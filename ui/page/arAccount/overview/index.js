import { connect } from 'react-redux';
import Overview from './view';
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

const perform = {
  doUpdateArweaveAddressStatus,
};

export default connect(select, perform)(Overview);
