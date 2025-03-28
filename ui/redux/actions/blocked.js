// @flow
import * as ACTIONS from 'constants/action_types';
import { GEO_BLOCK_API } from 'config';
import { selectPrefsReady } from 'redux/selectors/sync';
import { doAlertWaitingForSync } from 'redux/actions/app';
import { doToast } from 'redux/actions/notifications';

export function doToggleMuteChannel(uri: string, showLink: boolean, unmute: boolean = false) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const ready = selectPrefsReady(state);

    if (!ready) {
      return dispatch(doAlertWaitingForSync());
    }

    dispatch({
      type: ACTIONS.TOGGLE_BLOCK_CHANNEL,
      data: {
        uri,
      },
    });

    dispatch(
      doToast({
        message: __(!unmute ? 'Channel muted. You will not see them again.' : 'Channel unmuted!'),
        linkText: __(showLink ? 'See All' : ''),
        linkTarget: '/settings/block_and_mute',
      })
    );
  };
}

export function doChannelMute(uri: string, showLink: boolean = true) {
  return (dispatch: Dispatch) => {
    return dispatch(doToggleMuteChannel(uri, showLink));
  };
}

export function doChannelUnmute(uri: string, showLink: boolean = true) {
  return (dispatch: Dispatch) => {
    return dispatch(doToggleMuteChannel(uri, showLink, true));
  };
}

export function doFetchGeoBlockedList() {
  return (dispatch: Dispatch) => {
    dispatch({ type: ACTIONS.FETCH_GBL_STARTED });

    fetch(GEO_BLOCK_API)
      .then(async (res) => {
        let json = {};
        try {
          json = await res.json();
        } catch (e) {}
        const geoBlockList = json.data || {};
        dispatch({
          type: ACTIONS.FETCH_GBL_DONE,
          data: geoBlockList,
        });
      })
      .catch(() => {
        dispatch({ type: ACTIONS.FETCH_GBL_FAILED });
      });
  };
}
