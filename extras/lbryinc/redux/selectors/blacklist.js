import { selectClaimForUri } from 'redux/selectors/claims';
import { getChannelFromClaim } from 'util/claim';

export const selectState = (state) => state.blacklist || {};

export const selectBlackListedData = (state) => selectState(state).blackListedData;

export const selectIsClaimBlackListedForUri = (state, uri) => {
  const claim = selectClaimForUri(state, uri);
  const channelClaim = getChannelFromClaim(claim);

  const blackListedData = selectBlackListedData(state);

  return blackListedData[claim?.claim_id] || blackListedData[channelClaim?.claim_id || channelClaim?.channel_id];
};
