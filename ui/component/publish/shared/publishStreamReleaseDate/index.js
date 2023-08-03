import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import { selectPublishFormValue, selectIsScheduled } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectClientSetting, selectLanguage } from 'redux/selectors/settings';
import PublishStreamReleaseDate from './view';

const select = (state) => ({
  isScheduled: selectIsScheduled(state),
  releaseTime: selectPublishFormValue(state, 'releaseTime'),
  clock24h: selectClientSetting(state, SETTINGS.CLOCK_24H),
  appLanguage: selectLanguage(state),
});

const perform = (dispatch) => ({
  updatePublishForm: (value) => dispatch(doUpdatePublishForm(value)),
});

export default connect(select, perform)(PublishStreamReleaseDate);
