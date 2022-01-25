import { connect } from 'react-redux';
import OverlayPage from './view';

import { doFetchCreatorSettings, doUpdateCreatorSettings } from 'redux/actions/comments';
import { selectSettingsByChannelId } from 'redux/selectors/comments';
import { doToast } from 'redux/actions/notifications';

const select = (state) => ({
  settingsByChannelId: selectSettingsByChannelId(state),
});

const perform = (dispatch) => ({
  fetchCreatorSettings: (channelClaimId) => dispatch(doFetchCreatorSettings(channelClaimId)),
  updateCreatorSettings: (channelClaim, settings) => dispatch(doUpdateCreatorSettings(channelClaim, settings)),
  doToast: (props) => dispatch(doToast(props)),
});

export default connect(select, perform)(OverlayPage);
