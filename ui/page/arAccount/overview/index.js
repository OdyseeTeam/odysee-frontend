import { connect } from 'react-redux';
import Overview from './view';
import { selectAPIArweaveDefaultAccount, selectArAccountUpdating } from 'redux/selectors/stripe';
import { doUpdateArweaveAddressStatus } from 'redux/actions/stripe';

const select = (state) => ({
  accountUpdating: selectArAccountUpdating(state),
  defaultAccount: selectAPIArweaveDefaultAccount(state),
});

const perform = {
  doUpdateArweaveAddressStatus,
};

export default connect(select, perform)(Overview);
