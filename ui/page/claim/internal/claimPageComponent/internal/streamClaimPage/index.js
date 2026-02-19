import { connect } from 'react-redux';
import { doSetContentHistoryItem, doSetPrimaryUri } from 'redux/actions/content';
import { withRouter } from 'react-router-dom';
import * as COLLECTIONS_CONSTS from 'constants/collections';
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
import { LINKED_COMMENT_QUERY_PARAM, THREAD_COMMENT_QUERY_PARAM } from 'constants/comment';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import { selectCommentsListTitleForUri, selectCommentsDisabledSettingForChannelId } from 'redux/selectors/comments';
import { doToggleAppDrawer } from 'redux/actions/app';
import { doCommentSocketConnect, doCommentSocketDisconnect } from 'redux/actions/websocket';
import { selectClientSetting } from 'redux/selectors/settings';
import * as SETTINGS from 'constants/settings';
import * as RENDER_MODES from 'constants/file_render_modes';
import { getChannelIdFromClaim, isClaimShort } from 'util/claim';

import * as TAGS from 'constants/tags';

import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';

import StreamClaimPage from './view';

const select = (state, props) => {
  const { uri, isWooContent, wooYtId, wooClaimId, wooType, wooTimestamp, wooData, wooLoading, wooError } = props;
  const { search } = location;
  const autoplayMedia = selectClientSetting(state, SETTINGS.AUTOPLAY_MEDIA);
  const videoTheaterMode = selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE);

  const urlParams = new URLSearchParams(search);
  if (isWooContent) {
    const isWooLive = wooType === 'live';
    const isWooShort = wooType === 'short';

    return {
      commentsListTitle: __('Comments'),
      costInfo: null,
      thumbnail: wooData && wooData.thumbnail_url,
      isMature: false,
      linkedCommentId: urlParams.get(LINKED_COMMENT_QUERY_PARAM),
      renderMode: RENDER_MODES.VIDEO,
      commentsDisabled: false,
      threadCommentId: urlParams.get(THREAD_COMMENT_QUERY_PARAM),
      isProtectedContent: false,
      contentUnlocked: true,
      isLivestream: isWooLive,
      isClaimBlackListed: false,
      disableShortsView: !isWooShort,
      isClaimFiltered: false,
      isClaimShort: isWooShort,
      isWooContent: true,
      wooYtId,
      wooClaimId,
      wooType,
      wooTimestamp,
      wooData,
      wooLoading,
      wooError,
      autoplayMedia,
      videoTheaterMode,
    };
  }

  const claim = selectClaimForUri(state, uri);
  const channelId = getChannelIdFromClaim(claim);

  const claimId = claim?.claim_id;

  const commentSettingDisabled = selectCommentsDisabledSettingForChannelId(state, channelId);

  const filterData = selectFilteredDataForUri(state, uri);
  const isClaimFiltered = filterData && filterData.tag_name !== 'internal-hide-trending';

  const collectionSidebarId = urlParams.get(COLLECTIONS_CONSTS.COLLECTION_ID);

  return {
    commentsListTitle: selectCommentsListTitleForUri(state, uri),
    costInfo: selectCostInfoForUri(state, uri),
    thumbnail: selectThumbnailForUri(state, props.uri),
    isMature: selectClaimIsNsfwForUri(state, uri),
    linkedCommentId: urlParams.get(LINKED_COMMENT_QUERY_PARAM),
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
    commentsDisabled:
      commentSettingDisabled || makeSelectTagInClaimOrChannelForUri(uri, TAGS.DISABLE_COMMENTS_TAG)(state),
    threadCommentId: urlParams.get(THREAD_COMMENT_QUERY_PARAM),
    isProtectedContent: Boolean(selectProtectedContentTagForUri(state, uri)),
    contentUnlocked: claimId && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claimId),
    isLivestream: selectIsStreamPlaceholderForUri(state, uri),
    isClaimBlackListed: Boolean(selectBlackListedDataForUri(state, uri)),
    disableShortsView: !!collectionSidebarId || selectClientSetting(state, SETTINGS.DISABLE_SHORTS_VIEW),
    isClaimFiltered,
    isClaimShort: isClaimShort(claim),
    isWooContent: false,
    wooYtId,
    wooClaimId,
    wooType,
    wooTimestamp,
    wooData,
    wooLoading,
    wooError,
    autoplayMedia,
    videoTheaterMode,
  };
};

const perform = {
  doSetContentHistoryItem,
  doSetPrimaryUri,
  doToggleAppDrawer,
  doCommentSocketConnect,
  doCommentSocketDisconnect,
};

export default withRouter(connect(select, perform)(StreamClaimPage));
