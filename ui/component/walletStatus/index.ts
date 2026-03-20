import { connect } from 'react-redux';
import { doArConnect } from 'redux/actions/arwallet';
import { selectFullAPIArweaveAccounts } from 'redux/selectors/stripe';
import WalletStatus from './view';

const select = (state) => ({
  arweaveWallets: selectFullAPIArweaveAccounts(state),
});

export default connect(select, {
  doArConnect,
})(WalletStatus);
