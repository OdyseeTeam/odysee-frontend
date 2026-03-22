import { connect } from 'react-redux';
import { doSearch } from 'redux/actions/search';
import {
  selectIsSearching,
  makeSelectSearchUrisForQuery,
  selectSearchOptions,
  makeSelectHasReachedMaxResultsLength,
} from 'redux/selectors/search';
import { selectClientSetting, selectLanguage, selectShowMatureContent } from 'redux/selectors/settings';
import { getSearchQueryString } from 'util/query-params';
import SearchPage from './view';
import * as SETTINGS from 'constants/settings';

const select = (state) => {
  const showMature = selectShowMatureContent(state);
  const search = state.router?.location?.search || '';
  const urlParams = new URLSearchParams(search);
  const languageSetting = selectLanguage(state);
  const searchInLanguage = selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE);
  let urlQuery = urlParams.get('q') || null;

  if (urlQuery) {
    urlQuery = urlQuery.replace(/^lbry:\/\//i, '').replace(/\//, ' ');
  }

  const searchOptions = {
    ...selectSearchOptions(state),
    isBackgroundSearch: false,
    nsfw: showMature,
    ...(searchInLanguage
      ? {
          language: languageSetting,
        }
      : {}),
  };
  const query = getSearchQueryString(urlQuery, searchOptions);
  const uris = makeSelectSearchUrisForQuery(query)(state);
  const hasReachedMaxResultsLength = makeSelectHasReachedMaxResultsLength(query)(state);
  return {
    urlQuery,
    searchOptions,
    isSearching: selectIsSearching(state),
    uris: uris,
    hasReachedMaxResultsLength: hasReachedMaxResultsLength,
  };
};

const perform = (dispatch) => ({
  search: (query, options) => dispatch(doSearch(query, options)),
});

export default connect(select, perform)(SearchPage);
