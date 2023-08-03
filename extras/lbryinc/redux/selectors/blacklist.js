import { createSelector } from 'reselect';
import { selectClaimForUri } from 'redux/selectors/claims';
import { getChannelFromClaim } from 'util/claim';

export const selectState = (state) => state.blacklist || {};

export const selectBlackListedOutpoints = (state) => selectState(state).blackListedOutpoints;

export const selectBlacklistedOutpointMap = createSelector(selectBlackListedOutpoints, (outpoints) =>
  outpoints
    ? outpoints.reduce((acc, val) => {
        const outpoint = `${val.txid}:${val.nout}`;
        acc[outpoint] = 1;
        return acc;
      }, {})
    : {}
);

export const selectIsClaimBlackListedForUri = (state, uri) => {
  const claim = selectClaimForUri(state, uri);
  const channelClaim = getChannelFromClaim(claim);

  const blackListedOutpointMap = selectBlacklistedOutpointMap(state);
  const claimOutpoint = claim ? `${claim.txid}:${claim.nout}` : '';
  const channelOutpoint = channelClaim ? `${channelClaim.txid}:${channelClaim.nout}` : '';

  return blackListedOutpointMap[channelOutpoint] || blackListedOutpointMap[claimOutpoint];
};
