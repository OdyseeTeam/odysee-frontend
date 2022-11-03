import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import { selectHiddenScheduledContentTag, selectVisibleScheduledContentTag } from 'redux/selectors/claims';
import { selectPublishFormValue } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectClientSetting } from 'redux/selectors/settings';
import PublishReleaseDate from './view';

const select = (state, props) => ({
  releaseTime: selectPublishFormValue(state, 'releaseTime'),
  releaseTimeEdited: selectPublishFormValue(state, 'releaseTimeEdited'),
  clock24h: selectClientSetting(state, SETTINGS.CLOCK_24H),
  isHiddenScheduledContent: Boolean(selectHiddenScheduledContentTag(state, props.uri)),
  isVisibleScheduledContent: Boolean(selectVisibleScheduledContentTag(state, props.uri)),
});

const perform = (dispatch) => ({
  updatePublishForm: (value) => dispatch(doUpdatePublishForm(value)),
});

export default connect(select, perform)(PublishReleaseDate);
