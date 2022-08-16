import { connect } from 'react-redux';
import { doHideModal } from 'redux/actions/app';

import SettingsStripeCard from './view';

const perform = {
  doHideModal,
};

export default connect(null, perform)(SettingsStripeCard);
