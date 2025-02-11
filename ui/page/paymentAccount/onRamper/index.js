import { connect } from 'react-redux';
import { selectUserExperimentalUi } from 'redux/selectors/user';
import OnRamper from './view';

const select = (state) => ({
  experimentalUi: selectUserExperimentalUi(state),
});

export default connect(select, {})(OnRamper);
