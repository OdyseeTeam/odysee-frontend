import { connect } from 'react-redux';
import { doSetContentHistoryItem, doSetPrimaryUri } from 'redux/actions/content';
import {
  selectClaimIsNsfwForUri,
  selectClaimForUri,
  selectProtectedContentTagForUri,
  selectIsStreamPlaceholderForUri,
  selectCostInfoForUri,
  selectThumbnailForUri,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { selectBlackListedDataForUri, selectFilteredDataForUri } from 'lbryinc';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import { selectCommentsListTitleForUri, selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { doToggleAppDrawer } from 'redux/actions/app';
import { selectClientSetting } from 'redux/selectors/settings';
import * as SETTINGS from 'constants/settings';
import { getChannelIdFromClaim, isClaimShort } from 'util/claim';
import * as TAGS from 'constants/tags';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';
import StreamClaimPage from './view';

const select = (state, props) => {
  const { uri } = props;
  const claim = selectClaimForUri(state, uri);
  const channelId = getChannelIdFromClaim(claim);
  const claimId = claim?.claim_id;
  const commentSettingDisabled = selectCommentsDisabledSettingForChannelId(state, channelId);
  const filterData = selectFilteredDataForUri(state, uri);
  const isClaimFiltered = filterData && filterData.tag_name !== 'internal-hide-trending';
  return {
    commentsListTitle: selectCommentsListTitleForUri(state, uri),
    costInfo: selectCostInfoForUri(state, uri),
    thumbnail: selectThumbnailForUri(state, props.uri),
    isMature: selectClaimIsNsfwForUri(state, uri),
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    commentsDisabled:
      commentSettingDisabled || makeSelectTagInClaimOrChannelForUri(uri, TAGS.DISABLE_COMMENTS_TAG)(state),
    isProtectedContent: Boolean(selectProtectedContentTagForUri(state, uri)),
    contentUnlocked: claimId && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId),
    isLivestream: selectIsStreamPlaceholderForUri(state, uri),
    isClaimBlackListed: Boolean(selectBlackListedDataForUri(state, uri)),
    disableShortsViewSetting: selectClientSetting(state, SETTINGS.DISABLE_SHORTS_VIEW),
    isClaimFiltered,
    isClaimShort: isClaimShort(claim),
  };
};

const perform = {
  doSetContentHistoryItem,
  doSetPrimaryUri,
  doToggleAppDrawer,
};
export default connect(select, perform)(StreamClaimPage);
