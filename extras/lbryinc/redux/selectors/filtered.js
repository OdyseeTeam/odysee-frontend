import { createSelector } from 'reselect';
import { selectClaimForUri } from 'redux/selectors/claims';
import { getChannelFromClaim } from 'util/claim';

export const selectState = (state) => state.filtered || {};

export const selectFilteredData = (state) => selectState(state).filteredData;

export const selectIsClaimFilteredForUri = (state, uri) => {
  const claim = selectClaimForUri(state, uri);
  const channelClaim = getChannelFromClaim(claim);

  const filteredData = selectFilteredData(state);

  return filteredData[claim?.claim_id] || filteredData[channelClaim?.claim_id];
};
