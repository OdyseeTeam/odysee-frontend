import { connect } from 'react-redux';
import { selectArConnectStatus } from '../../redux/selectors/arConnect';
import { doCheckArConnectStatus } from '../../redux/actions/arConnect';
import { selectThemePath } from 'redux/selectors/settings';
import BuyPage from './view';

const select = (state) => ({
  arConnectStatus: selectArConnectStatus(state),
  theme: selectThemePath(state),
});

export default connect(select, {
  doCheckArConnectStatus,
})(BuyPage);
