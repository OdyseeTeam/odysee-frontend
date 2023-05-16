// @flow
import { connect } from 'react-redux';
import type { Props } from './view';
import PublishReleaseDate from './view';

import * as SETTINGS from 'constants/settings';
import { selectMyClaimForUri, selectPublishFormValue } from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
import { selectClientSetting, selectLanguage } from 'redux/selectors/settings';

const select = (state) => ({
  claimToEdit: selectMyClaimForUri(state),
  releaseTime: selectPublishFormValue(state, 'releaseTime'),
  releaseTimeDisabled: selectPublishFormValue(state, 'releaseTimeDisabled'),
  releaseTimeError: selectPublishFormValue(state, 'releaseTimeError'),
  clock24h: selectClientSetting(state, SETTINGS.CLOCK_24H),
  appLanguage: selectLanguage(state),
});

const perform = {
  updatePublishForm: doUpdatePublishForm,
};

export default connect<_, Props, _, _, _, _>(select, perform)(PublishReleaseDate);
