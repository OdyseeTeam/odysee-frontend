import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { selectClaimForUri } from 'redux/selectors/claims';
import { doFetchRecommendedContent } from 'redux/actions/search';
import { selectRecommendedContentForUri, selectIsSearching, selectSearchResultByQuery } from 'redux/selectors/search';
import RecommendedContent from './view';
import { selectClientSetting, selectLanguage, selectShowMatureContent } from 'redux/selectors/settings';
import * as SETTINGS from 'constants/settings';
import { getRecommendationSearchKey, getRecommendationSearchOptions } from 'util/search';

const select = (state, props) => {
  const searchInLanguage = selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE);
  let recommendedContentUris = selectRecommendedContentForUri(state, props.uri);

  if (
    (!recommendedContentUris || recommendedContentUris.length === 0) &&
    props.recommendationClaimId &&
    props.recommendationTitle
  ) {
    const matureEnabled = selectShowMatureContent(state);
    const languageSetting = selectLanguage(state);
    const language = searchInLanguage ? languageSetting : null;
    const options = getRecommendationSearchOptions(
      matureEnabled,
      false,
      props.recommendationClaimId,
      language,
      props.includeRelatedTo !== false
    );
    const normalizedSearchQuery = getRecommendationSearchKey(props.recommendationTitle, options);
    const resultsByQuery = selectSearchResultByQuery(state);

    recommendedContentUris = resultsByQuery[normalizedSearchQuery]?.uris;
  }

  const nextRecommendedUri = recommendedContentUris && recommendedContentUris[0];

  return {
    claim: selectClaimForUri(state, props.uri),
    recommendedContentUris,
    nextRecommendedUri,
    isSearching: selectIsSearching(state),
    searchInLanguage,
  };
};

export default withRouter(connect(select, { doFetchRecommendedContent })(RecommendedContent));
