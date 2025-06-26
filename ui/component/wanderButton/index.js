import { connect } from 'react-redux';
import { selectArweaveStatus } from 'redux/selectors/arwallet';
import WanderButton from './view';

const select = (state) => ({
  arweaveStatus: selectArweaveStatus(state),
});

const perform = (dispatch) => ({
});

export default connect(select, perform)(WanderButton);
