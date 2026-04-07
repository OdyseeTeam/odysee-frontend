import { createSlice } from '@reduxjs/toolkit';
import * as ACTIONS from 'constants/action_types';
import { DEFAULT_KNOWN_TAGS, DEFAULT_FOLLOWED_TAGS } from 'constants/tags';

function getDefaultKnownTags() {
  return DEFAULT_FOLLOWED_TAGS.concat(DEFAULT_KNOWN_TAGS).reduce(
    (tagsMap, tag) => {
      tagsMap[tag] = { name: tag };
      return tagsMap;
    },
    {} as Record<string, { name: string }>
  );
}

const initialState: TagState = {
  followedTags: [],
  knownTags: getDefaultKnownTags(),
};

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(ACTIONS.TOGGLE_TAG_FOLLOW, (state, action: any) => {
        const { name } = action.data;
        const idx = state.followedTags.indexOf(name);
        if (idx !== -1) {
          state.followedTags.splice(idx, 1);
        } else {
          state.followedTags.push(name);
        }
      })
      .addCase(ACTIONS.TAG_ADD, (state, action: any) => {
        const { name } = action.data;
        state.knownTags[name] = { name };
      })
      .addCase(ACTIONS.TAG_DELETE, (state, action: any) => {
        const { name } = action.data;
        delete state.knownTags[name];
        const idx = state.followedTags.indexOf(name);
        if (idx !== -1) {
          state.followedTags.splice(idx, 1);
        }
      })
      .addCase(ACTIONS.USER_STATE_POPULATE, (state, action: any) => {
        const { tags } = action.data;
        if (Array.isArray(tags)) {
          state.followedTags = tags.filter((tag: any) => typeof tag === 'string');
        }
      });
  },
});

export default tagsSlice.reducer;
