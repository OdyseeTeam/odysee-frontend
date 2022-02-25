import { connect } from 'react-redux';
import SettingsOverlayPage from './view';
import { doFetchCreatorSettings, doUpdateCreatorSettings } from 'redux/actions/comments';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectSettingsByChannelId } from 'redux/selectors/comments';
import { selectHasChannels, selectFetchingMyChannels } from 'redux/selectors/claims';
import { selectDaemonSettings } from 'redux/selectors/settings';
import { selectUserVerifiedEmail } from 'redux/selectors/user';

const select = (state) => {
  const activeChannelClaim = selectActiveChannelClaim(state);
  const settingsByChannelId = selectSettingsByChannelId(state);
  const { claim_id: channelId } = activeChannelClaim || {};
  const daemonSettings = selectDaemonSettings(state);
  const isAuthenticated = selectUserVerifiedEmail(state);
  return {
    channelId,
    hasChannels: selectHasChannels(state),
    fetchingChannels: selectFetchingMyChannels(state),
    activeChannelClaim,
    settingsByChannelId,
    daemonSettings,
    isAuthenticated,
  };
};

const perform = (dispatch) => ({
  fetchCreatorSettings: (channelClaimId) => dispatch(doFetchCreatorSettings(channelClaimId)),
  updateCreatorSettings: (channelClaim, settings) => dispatch(doUpdateCreatorSettings(channelClaim, settings)),
});

export default connect(select, perform)(SettingsOverlayPage);
