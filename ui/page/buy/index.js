import { connect } from 'react-redux';
import { selectUserExperimentalUi } from 'redux/selectors/user';
import { selectArweaveConnected } from 'redux/selectors/arwallet';
import { selectThemePath } from 'redux/selectors/settings';
import BuyPage from './view';

const select = (state) => ({
  arWalletStatus: selectArweaveConnected(state),
  theme: selectThemePath(state),
  experimentalUi: selectUserExperimentalUi(state),
});

export default connect(select, {})(BuyPage);
