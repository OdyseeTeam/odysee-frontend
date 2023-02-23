import { connect } from 'react-redux';
import { makeSelectDownloadPathForUri, selectStreamingUrlForUri } from 'redux/selectors/file_info';
import { makeSelectClaimForUri, selectThumbnailForUri, makeSelectContentTypeForUri } from 'redux/selectors/claims';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting } from 'redux/selectors/settings';
import { makeSelectFileRenderModeForUri, makeSelectFileExtensionForUri } from 'redux/selectors/content';
import { doAnalyticsViewForUri } from 'redux/actions/app';
import { doClaimEligiblePurchaseRewards } from 'redux/actions/rewards';
import withStreamClaimRender from 'hocs/withStreamClaimRender';

import StreamClaimRenderInline from './view';

const select = (state, props) => {
  const autoplay = props.embedded ? false : selectClientSetting(state, SETTINGS.AUTOPLAY_MEDIA);
  return {
    currentTheme: selectClientSetting(state, SETTINGS.THEME),
    claim: makeSelectClaimForUri(props.uri)(state),
    thumbnail: selectThumbnailForUri(state, props.uri),
    contentType: makeSelectContentTypeForUri(props.uri)(state),
    downloadPath: makeSelectDownloadPathForUri(props.uri)(state),
    fileExtension: makeSelectFileExtensionForUri(props.uri)(state),
    streamingUrl: selectStreamingUrlForUri(state, props.uri),
    renderMode: makeSelectFileRenderModeForUri(props.uri)(state),
    autoplay: autoplay,
  };
};

const perform = (dispatch) => ({
  doAnalyticsViewForUri: (uri) => dispatch(doAnalyticsViewForUri(uri)),
  claimRewards: () => dispatch(doClaimEligiblePurchaseRewards()),
});

export default withStreamClaimRender(connect(select, perform)(StreamClaimRenderInline));
