import { connect } from 'react-redux';
import { doArConnect } from 'redux/actions/arwallet';
import { selectArweaveAddress } from 'redux/selectors/arwallet';
import WalletConnect from './view';

const select = (state) => ({
  arweaveAddress: selectArweaveAddress(state),
});

const perform = (dispatch) => ({
  connectArWallet: () => dispatch(doArConnect()),
});

export default connect(select, perform)(WalletConnect);
