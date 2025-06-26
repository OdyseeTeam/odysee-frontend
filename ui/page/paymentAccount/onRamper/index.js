import { connect } from 'react-redux';
import OnRamper from './view';
import { selectAPIArweaveDefaultAccount } from 'redux/selectors/stripe';

const select = (state) => ({
  arweaveAccount: selectAPIArweaveDefaultAccount(state),
});

export default connect(select, {})(OnRamper);
