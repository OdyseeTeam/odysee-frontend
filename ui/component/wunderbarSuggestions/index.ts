import { connect } from 'react-redux';
import { selectClientSetting, selectLanguage, selectShowMatureContent } from 'redux/selectors/settings';
import { doToast } from 'redux/actions/notifications';
import { doHideModal } from 'redux/actions/app';
import { doResolveUris } from 'redux/actions/claims';
import { selectSubscriptionUris } from 'redux/selectors/subscriptions';
import { selectClaimsByUri } from 'redux/selectors/claims';
import analytics from 'analytics';
import Wunderbar from './view';
import * as SETTINGS from 'constants/settings';
import { history } from 'redux/router';

const select = (state) => ({
  languageSetting: selectLanguage(state),
  searchInLanguage: selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE),
  showMature: selectShowMatureContent(state),
  claimsByUri: selectClaimsByUri(state),
  subscriptionUris: selectSubscriptionUris(state) || [],
});

const perform = (dispatch) => ({
  doResolveUris: (uris) => dispatch(doResolveUris(uris)),
  navigateToSearchPage: (query) => {
    const encodedQuery = encodeURIComponent(query);
    history.push({
      pathname: `/$/search`,
      search: `?q=${encodedQuery}`,
    });
    analytics.apiLog.search();
  },
  doShowSnackBar: (message) =>
    dispatch(
      doToast({
        isError: true,
        message,
      })
    ),
  doCloseMobileSearch: () => dispatch(doHideModal()),
});
export default connect(select, perform)(Wunderbar);
