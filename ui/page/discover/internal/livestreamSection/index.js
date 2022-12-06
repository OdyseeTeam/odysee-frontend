import { connect } from 'react-redux';

import * as SETTINGS from 'constants/settings';

import { resolveLangForClaimSearch } from 'util/default-languages';

import { selectFilteredActiveLivestreamUris } from 'redux/selectors/livestream';
import { selectClientSetting, selectLanguage } from 'redux/selectors/settings';

import { doFetchAllActiveLivestreamsForQuery } from 'redux/actions/livestream';

import LivestreamSection from './view';

const select = (state, props) => {
  const { searchLanguages, langParam, channelIds, excludedChannelIds } = props;

  const languageSetting = selectLanguage(state);
  const searchInLanguage = selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE);

  const langCsv = resolveLangForClaimSearch(languageSetting, searchInLanguage, searchLanguages, langParam);
  const lang = langCsv ? langCsv.split(',') : null;
  const livestreamSectionQuery = { any_languages: lang };
  const livestreamSectionQueryStr = JSON.stringify(livestreamSectionQuery);

  return {
    livestreamSectionQueryStr,
    activeLivestreamUris: selectFilteredActiveLivestreamUris(
      state,
      channelIds,
      excludedChannelIds,
      livestreamSectionQueryStr
    ),
  };
};

const perform = {
  doFetchAllActiveLivestreamsForQuery,
};

export default connect(select, perform)(LivestreamSection);
