import { connect } from 'react-redux';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import {
  selectIsFetchingClaimListMine,
  selectMyClaimsPage,
  selectMyClaimsPageItemCount,
  selectFetchingMyClaimsPageError,
  selectMyChannelClaimIds,
  selectMyPublicationClaims,
  selectHasPublicationClaims,
  selectMyStreamClaims,
  selectMyRepostClaims,
  selectMyUnlistedClaims,
  selectMyScheduledClaims,
  selectIsAllMyClaimsFetched,
} from 'redux/selectors/claims';
import { selectUploadCount } from 'redux/selectors/publish';
import { doFetchClaimListMine, doCheckPendingClaims, doClearClaimSearch } from 'redux/actions/claims';
import { doBeginPublish } from 'redux/actions/publish';
import { selectUploadsFilteringSetting } from 'redux/selectors/settings';
import { doSetClientSetting } from 'redux/actions/settings';
import FileListPublished from './view';
import { withRouter } from 'react-router';
import { MY_CLAIMS_PAGE_SIZE, PAGE_PARAM, PAGE_SIZE_PARAM } from 'constants/claim';

const select = (state, props) => {
  const { search } = props.location;
  const urlParams = new URLSearchParams(search);
  const page = Number(urlParams.get(PAGE_PARAM)) || '1';
  const pageSize = urlParams.get(PAGE_SIZE_PARAM) || String(MY_CLAIMS_PAGE_SIZE);

  const filteringSettings = selectUploadsFilteringSetting(state);

  return {
    page,
    pageSize,
    activeChannel: selectActiveChannelClaim(state),
    fetching: selectIsFetchingClaimListMine(state),
    urls: selectMyClaimsPage(state),
    urlTotal: selectMyClaimsPageItemCount(state),
    isAllMyClaimsFetched: selectIsAllMyClaimsFetched(state),
    myClaims: selectMyPublicationClaims(state),
    hasClaims: selectHasPublicationClaims(state),
    myStreamClaims: selectMyStreamClaims(state),
    myRepostClaims: selectMyRepostClaims(state),
    myUnlistedClaims: selectMyUnlistedClaims(state),
    myScheduledClaims: selectMyScheduledClaims(state),
    error: selectFetchingMyClaimsPageError(state),
    uploadCount: selectUploadCount(state),
    myChannelIds: selectMyChannelClaimIds(state),
    isFilteringEnabled: filteringSettings.isFilteringEnabled,
    sortOption: filteringSettings.sortOption,
  };
};

const perform = {
  checkPendingPublishes: doCheckPendingClaims,
  fetchClaimListMine: doFetchClaimListMine,
  doClearClaimSearch,
  doBeginPublish,
  doSetClientSetting,
};

export default withRouter(connect(select, perform)(FileListPublished));
