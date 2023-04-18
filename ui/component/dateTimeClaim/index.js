import { connect } from 'react-redux';
import DateTimeClaim from './view';

import { selectDateForUri } from 'redux/selectors/claims';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting } from 'redux/selectors/settings';

const select = (state, props) => ({
  clock24h: selectClientSetting(state, SETTINGS.CLOCK_24H),
  date: selectDateForUri(state, props.uri),
});

export default connect(select)(DateTimeClaim);
