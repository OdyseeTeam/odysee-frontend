import { connect } from 'react-redux';

import * as CS from 'constants/claim_search';
import * as SETTINGS from 'constants/settings';

import { resolveLangForClaimSearch } from 'util/default-languages';

import { selectActiveLivestreamsForQuery } from 'redux/selectors/livestream';
import { selectClientSetting, selectLanguage } from 'redux/selectors/settings';

import { doFetchAllActiveLivestreamsForQuery } from 'redux/actions/livestream';

import LivestreamSection from './view';

const select = (state, props) => {
  const { searchLanguages, langParam } = props;

  const languageSetting = selectLanguage(state);
  const searchInLanguage = selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE);

  const langCsv = resolveLangForClaimSearch(languageSetting, searchInLanguage, searchLanguages, langParam);
  const lang = langCsv ? langCsv.split(',') : null;
  const livestreamSectionQuery = { order_by: CS.ORDER_BY_NEW_VALUE, any_languages: lang };
  const livestreamSectionQueryStr = JSON.stringify(livestreamSectionQuery);

  return {
    livestreamSectionQueryStr,
    activeLivestreams: selectActiveLivestreamsForQuery(state, livestreamSectionQueryStr),
  };
};

const perform = {
  doFetchAllActiveLivestreamsForQuery,
};

export default connect(select, perform)(LivestreamSection);
