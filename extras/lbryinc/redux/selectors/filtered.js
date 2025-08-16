import { selectClaimForUri } from 'redux/selectors/claims';
import { getChannelFromClaim } from 'util/claim';

export const selectState = (state) => state.filtered || {};

export const selectFilteredData = (state) => selectState(state).filteredData;

export const selectFilterDataForUri = (state, uri) => {
  const claim = selectClaimForUri(state, uri);
  const channelClaim = getChannelFromClaim(claim);

  const filteredData = selectFilteredData(state);

  return filteredData[claim?.claim_id] || filteredData[channelClaim?.claim_id || channelClaim?.channel_id];
};
