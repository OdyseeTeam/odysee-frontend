import { connect } from 'react-redux';
import { doSetDaemonSetting } from 'redux/actions/settings';
import { selectDaemonSettings } from 'redux/selectors/settings';
import { doOpenModal } from 'redux/actions/app';
import PremiumBadge from './view';

const select = (state) => ({
  daemonSettings: selectDaemonSettings(state),
});
const perform = (dispatch) => ({
  setDaemonSetting: (key, value) => dispatch(doSetDaemonSetting(key, value)),
  openModal: (modal, props) => dispatch(doOpenModal(modal, props)),
});

export default connect(select, perform)(PremiumBadge);
