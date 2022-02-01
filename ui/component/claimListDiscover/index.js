import { connect } from 'react-redux';
import {
  selectClaimsByUri,
  selectClaimSearchByQuery,
  selectClaimSearchByQueryLastPageReached,
  selectFetchingClaimSearch,
} from 'redux/selectors/claims';
import {
  selectIsSearching,
  makeSelectSearchUrisForQuery,
  makeSelectHasReachedMaxResultsLength,
} from 'redux/selectors/search';
import { getSearchQueryString } from 'util/query-params';
import { doClaimSearch } from 'redux/actions/claims';
import { doSearch } from 'redux/actions/search';
import * as SETTINGS from 'constants/settings';
import { selectFollowedTags } from 'redux/selectors/tags';
import { selectMutedChannels } from 'redux/selectors/blocked';
import { selectClientSetting, selectShowMatureContent, selectLanguage } from 'redux/selectors/settings';
import { selectModerationBlockList } from 'redux/selectors/comments';
import ClaimListDiscover from './view';
import { doFetchViewCount } from 'lbryinc';

const getChannelInnerSearchSelect = (state, props) => {
  const { channelInnerSearchKeyword, channelInnerSearchOptions } = props;
  const channelInnerSearchQuery = getSearchQueryString(channelInnerSearchKeyword, channelInnerSearchOptions);
  const channelInnerSearchResult = makeSelectSearchUrisForQuery(channelInnerSearchQuery)(state);
  const channelInnerSearchResultLastPageReached = makeSelectHasReachedMaxResultsLength(channelInnerSearchQuery)(state);

  return {
    channelInnerSearchResult,
    channelInnerSearchResultLastPageReached,
  };
};

const select = (state, props) => ({
  followedTags: selectFollowedTags(state),
  claimSearchByQuery: selectClaimSearchByQuery(state),
  claimSearchByQueryLastPageReached: selectClaimSearchByQueryLastPageReached(state),
  claimsByUri: selectClaimsByUri(state),
  showNsfw: selectShowMatureContent(state),
  hideReposts: selectClientSetting(state, SETTINGS.HIDE_REPOSTS),
  languageSetting: selectLanguage(state),
  mutedUris: selectMutedChannels(state),
  blockedUris: selectModerationBlockList(state),
  searchInLanguage: selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE),

  // channel inner search
  ...getChannelInnerSearchSelect(state, props),

  loading: props.loading !== undefined ? props.loading : selectFetchingClaimSearch(state) || selectIsSearching(state),
});

const perform = {
  doClaimSearch,
  doFetchViewCount,
  doChannelInnerSearch: doSearch,
};

export default connect(select, perform)(ClaimListDiscover);
