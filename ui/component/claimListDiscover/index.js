import { connect } from 'react-redux';
import {
  selectById,
  selectClaimsByUri,
  selectClaimSearchByQuery,
  selectClaimSearchByQueryLastPageReached,
  selectFetchingClaimSearch,
} from 'redux/selectors/claims';
import { doClaimSearch, doResolveClaimIds, doResolveUris } from 'redux/actions/claims';
import { doFetchItemsInCollection } from 'redux/actions/collections';
import * as SETTINGS from 'constants/settings';
import { selectFollowedTags } from 'redux/selectors/tags';
import { selectMutedChannels } from 'redux/selectors/blocked';
import { doFetchOdyseeMembershipForChannelIds } from 'redux/actions/memberships';
import { selectClientSetting, selectShowMatureContent, selectLanguage } from 'redux/selectors/settings';
import { selectModerationBlockList } from 'redux/selectors/comments';
import ClaimListDiscover from './view';
import { doFetchViewCount } from 'lbryinc';

function resolveHideMembersOnly(global, override) {
  return override === undefined || override === null ? global : override;
}

// prettier-ignore
const select = (state, props) => ({
  blockedUris: selectModerationBlockList(state),
  claimSearchByQuery: selectClaimSearchByQuery(state),
  claimSearchByQueryLastPageReached: selectClaimSearchByQueryLastPageReached(state),
  claimsById: selectById(state),
  claimsByUri: selectClaimsByUri(state),
  followedTags: selectFollowedTags(state),
  hideMembersOnly: resolveHideMembersOnly(selectClientSetting(state, SETTINGS.HIDE_MEMBERS_ONLY_CONTENT), props.hideMembersOnly),
  hideReposts: selectClientSetting(state, SETTINGS.HIDE_REPOSTS),
  languageSetting: selectLanguage(state),
  loading: props.loading !== undefined ? props.loading : selectFetchingClaimSearch(state),
  mutedUris: selectMutedChannels(state),
  searchInLanguage: selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE),
  showNsfw: selectShowMatureContent(state),
});

const perform = {
  doClaimSearch,
  doFetchViewCount,
  doFetchOdyseeMembershipForChannelIds,
  doResolveClaimIds,
  doResolveUris,
  doFetchItemsInCollection,
};

export default connect(select, perform)(ClaimListDiscover);
