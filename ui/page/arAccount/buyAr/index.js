import { connect } from 'react-redux';
import { doToast } from 'redux/actions/notifications';
import BuyAr from './view';

const select = (state) => ({});

const perform = {
  doToast,
};

export default connect(select, perform)(BuyAr);
