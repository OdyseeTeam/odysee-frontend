import { connect } from 'react-redux';
import { selectUserExperimentalUi } from 'redux/selectors/user';
import OnRamper from './view';
import { selectAPIArweaveDefaultAccount } from 'redux/selectors/stripe';

const select = (state) => ({
  experimentalUi: selectUserExperimentalUi(state),
  arweaveAccount: selectAPIArweaveDefaultAccount(state),
});

export default connect(select, {})(OnRamper);
