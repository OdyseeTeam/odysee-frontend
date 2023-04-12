import { connect } from 'react-redux';
import * as SETTINGS from 'constants/settings';
import { selectMyClaimForUri, selectPublishFormValue } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectClientSetting, selectLanguage } from 'redux/selectors/settings';
import PublishReleaseDate from './view';

const select = (state) => ({
  claimToEdit: selectMyClaimForUri(state),
  releaseTime: selectPublishFormValue(state, 'releaseTime'),
  releaseTimeError: selectPublishFormValue(state, 'releaseTimeError'),
  clock24h: selectClientSetting(state, SETTINGS.CLOCK_24H),
  appLanguage: selectLanguage(state),
});

const perform = (dispatch) => ({
  updatePublishForm: (value) => dispatch(doUpdatePublishForm(value)),
});

export default connect(select, perform)(PublishReleaseDate);
