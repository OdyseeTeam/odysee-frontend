import { createSelector } from 'reselect';
import { selectClaimForUri } from 'redux/selectors/claims';
import { getChannelFromClaim } from 'util/claim';

export const selectState = (state) => state.filtered || {};

export const selectFilteredOutpoints = (state) => selectState(state).filteredOutpoints;

export const selectFilteredOutpointMap = createSelector(selectFilteredOutpoints, (outpoints) =>
  outpoints
    ? outpoints.reduce((acc, val) => {
        const outpoint = `${val.txid}:${val.nout}`;
        acc[outpoint] = 1;
        return acc;
      }, {})
    : {}
);

export const selectIsClaimFilteredForUri = (state, uri) => {
  const claim = selectClaimForUri(state, uri);
  const channelClaim = getChannelFromClaim(claim);

  const filteredOutpointMap = selectFilteredOutpointMap(state);
  const claimOutpoint = claim ? `${claim.txid}:${claim.nout}` : '';
  const channelOutpoint = channelClaim ? `${channelClaim.txid}:${channelClaim.nout}` : '';

  return filteredOutpointMap[channelOutpoint] || filteredOutpointMap[claimOutpoint];
};
