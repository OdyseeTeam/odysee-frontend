import { connect } from 'react-redux';
import { selectArweaveAddress } from '../../../redux/selectors/arwallet';
import ArWallets from './view';

const select = (state) => ({
  activeAddress: selectArweaveAddress(state),
});

export default connect(select, {})(ArWallets);
