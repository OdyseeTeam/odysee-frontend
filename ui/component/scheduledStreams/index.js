import { connect } from 'react-redux';
import ScheduledStreams from './view';
import { doSetClientSetting } from 'redux/actions/settings';
import { doToast } from 'redux/actions/notifications';

const perform = (dispatch) => ({
  setClientSetting: (key, value) => dispatch(doSetClientSetting(key, value)),
  doShowSnackBar: (message) => dispatch(doToast({ isError: false, message })),
});

export default connect(null, perform)(ScheduledStreams);
