import { connect } from 'react-redux';
import {
  selectDateForUri,
  selectCreationDateForUri,
  selectUnlistedContentTag,
  selectPrivateContentTag,
  selectScheduledContentReleasedInFuture,
} from 'redux/selectors/claims';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting } from 'redux/selectors/settings';
import DateTime from './view';

const select = (state, props) => ({
  date: props.date || selectDateForUri(state, props.uri),
  clock24h: selectClientSetting(state, SETTINGS.CLOCK_24H),
  creationDate: selectCreationDateForUri(state, props.uri),
  isUnlistedContent: Boolean(selectUnlistedContentTag(state, props.uri)),
  isPrivateContent: Boolean(selectPrivateContentTag(state, props.uri)),
  scheduledContentReleasedInFuture: selectScheduledContentReleasedInFuture(state, props.uri),
});
export default connect(select)(DateTime);
