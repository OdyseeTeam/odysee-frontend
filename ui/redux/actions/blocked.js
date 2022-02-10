// @flow
import * as ACTIONS from 'constants/action_types';
import { selectPrefsReady } from 'redux/selectors/sync';
import { doAlertWaitingForSync } from 'redux/actions/app';
import { doToast } from 'redux/actions/notifications';
import { selectChannelIsMuted } from 'redux/selectors/blocked';

export function doToggleMuteChannel(uri: string, hideLink: boolean) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const ready = selectPrefsReady(state);

    if (!ready) return dispatch(doAlertWaitingForSync());

    const isMuted = selectChannelIsMuted(state, uri);

    dispatch({ type: ACTIONS.TOGGLE_BLOCK_CHANNEL, data: { uri } });

    dispatch(
      doToast({
        message: __(!isMuted ? 'Channel muted. You will not see them again.' : 'Channel unmuted!'),
        linkText: __(hideLink ? '' : 'See All'),
        linkTarget: '/settings/block_and_mute',
      })
    );
  };
}
