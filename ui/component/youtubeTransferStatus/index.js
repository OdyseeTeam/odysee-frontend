import { connect } from 'react-redux';
import { doClaimYoutubeChannels, doUserFetch, doCheckYoutubeTransfer } from 'redux/actions/user';
import {
  selectYoutubeChannels,
  selectYouTubeImportVideosComplete,
  selectYouTubeImportPending,
  selectUserIsPending,
} from 'redux/selectors/user';
import { doResolveUris } from 'redux/actions/claims';
import YoutubeChannelList from './view';

const select = (state) => ({
  youtubeChannels: selectYoutubeChannels(state),
  youtubeImportPending: selectYouTubeImportPending(state),
  userFetchPending: selectUserIsPending(state),
  videosImported: selectYouTubeImportVideosComplete(state),
});

const perform = (dispatch) => ({
  claimChannels: () => dispatch(doClaimYoutubeChannels()),
  updateUser: () => dispatch(doUserFetch()),
  checkYoutubeTransfer: () => dispatch(doCheckYoutubeTransfer()),
  doResolveUris: (uris) => dispatch(doResolveUris(uris)),
});

export default connect(select, perform)(YoutubeChannelList);
