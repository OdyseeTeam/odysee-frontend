import { connect } from 'react-redux';
import { selectArConnectStatus } from 'redux/selectors/arConnect';
import { doCheckArConnectStatus, doDisconnectArConnect } from 'redux/actions/arConnect';
import PaymentAccountPage from './view';

const select = (state) => ({
  arConnectStatus: selectArConnectStatus(state),
});

export default connect(select, {
  doCheckArConnectStatus,
  doDisconnectArConnect,
})(PaymentAccountPage);
