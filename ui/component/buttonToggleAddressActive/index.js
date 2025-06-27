import { connect } from 'react-redux';
import ButtonToggleAddressActive from './view';
import { doUpdateArweaveAddressStatus } from 'redux/actions/stripe';
import { selectArAccountUpdating, selectArweaveAccountForAddress } from 'redux/selectors/stripe';

const select = (state, props) => {
  const { address } = props;

  return {
    account: selectArweaveAccountForAddress(state, address),
    accountUpdating: selectArAccountUpdating(state),
  };
};

const perform = {
  doUpdateArweaveAddressStatus,
};

export default connect(select, perform)(ButtonToggleAddressActive);
