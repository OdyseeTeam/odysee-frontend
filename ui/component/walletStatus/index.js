import { connect } from 'react-redux';
import { doArConnect } from 'redux/actions/arwallet';
import WalletStatus from './view';

const select = (state) => ({});

export default connect(select, {
  doArConnect,
})(WalletStatus);
