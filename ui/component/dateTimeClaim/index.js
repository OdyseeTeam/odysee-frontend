import { connect } from 'react-redux';
import DateTimeClaim from './view';

import { selectTagsRawForUri, selectTimestampsForUri } from 'redux/selectors/claims';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting } from 'redux/selectors/settings';

const select = (state, props) => ({
  claimTsList: selectTimestampsForUri(state, props.uri),
  clock24h: selectClientSetting(state, SETTINGS.CLOCK_24H),
  tags: selectTagsRawForUri(state, props.uri),
});

export default connect(select)(DateTimeClaim);
