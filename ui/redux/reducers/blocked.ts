import { createSlice } from '@reduxjs/toolkit';
import * as ACTIONS from 'constants/action_types';
import { getOldFormatForLbryUri } from 'util/lbryURI';

const initialState: BlocklistState = {
  blockedChannels: [],
  geoBlockedList: undefined,
  gblFetchFailed: false,
};

const blockedSlice = createSlice({
  name: 'blocked',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(ACTIONS.TOGGLE_BLOCK_CHANNEL, (state, action: any) => {
        const { uri } = action.data;
        const idx = state.blockedChannels.indexOf(uri);
        if (idx !== -1) {
          state.blockedChannels.splice(idx, 1);
        } else {
          state.blockedChannels.unshift(uri);
        }
      })
      .addCase(ACTIONS.FETCH_GBL_DONE, (state, action: any) => {
        state.gblFetchFailed = false;
        state.geoBlockedList = action.data;
      })
      .addCase(ACTIONS.FETCH_GBL_FAILED, (state) => {
        state.gblFetchFailed = true;
      })
      .addCase(ACTIONS.USER_STATE_POPULATE, (state, action: any) => {
        const { blocked } = action.data;
        const sanitizedBlocked = blocked && blocked.filter((e: any) => typeof e === 'string');
        const parsedBlocked =
          sanitizedBlocked && Array.from(new Set(sanitizedBlocked.map((uri: string) => getOldFormatForLbryUri(uri))));
        if (parsedBlocked) {
          state.blockedChannels = parsedBlocked;
        }
      });
  },
});

export default blockedSlice.reducer;
