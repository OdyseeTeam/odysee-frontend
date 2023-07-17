// @flow
import { selectClaimIdForUri } from 'redux/selectors/claims';

const selectState = (state: State) => state.stats || {};
export const selectViewCount = (state: State) => selectState(state).viewCountById;
export const selectSubCount = (state: State) => selectState(state).subCountById;

export const selectViewCountForUri = (state: State, uri: string) => {
  const claimId = selectClaimIdForUri(state, uri);
  const viewCountById = selectViewCount(state);
  return claimId ? viewCountById[claimId] : undefined;
};

export const selectSubCountForUri = (state: State, uri: string) => {
  const claimId = selectClaimIdForUri(state, uri);
  const subCountById = selectSubCount(state);
  return claimId ? subCountById[claimId] : undefined;
};
