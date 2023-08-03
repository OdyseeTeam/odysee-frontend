import { connect } from 'react-redux';
import DebugLog from './view';
import { doClearDebugLog } from 'redux/actions/notifications';
import { selectDebugLog } from 'redux/selectors/notifications';

const select = (state) => ({
  debugLog: selectDebugLog(state),
});

const perform = {
  doClearDebugLog,
};

export default connect(select, perform)(DebugLog);
