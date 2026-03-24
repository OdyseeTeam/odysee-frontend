// @flow

// TODO: This should be in 'redux/selectors/claim.js'. Temporarily putting it
// here to get past importing issues with 'lbryinc', which the real fix might
// involve moving it from 'extras' to 'ui' (big change).

import { createCachedSelector } from 're-reselect';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectMutedChannels } from 'redux/selectors/blocked';
import { selectModerationBlockList } from 'redux/selectors/comments';
import { selectFilteredData, selectBlackListedData } from 'lbryinc';
import { getChannelFromClaim } from 'util/claim';
import { isURIEqual } from 'util/lbryURI';

const ALL_CLEAR_STATE = Object.freeze({});

export const selectBanStateForUri = createCachedSelector(
  selectClaimForUri,
  selectBlackListedData,
  selectFilteredData,
  selectMutedChannels,
  selectModerationBlockList,
  (claim, blackListedData, filteredData, mutedChannelUris, personalBlocklist) => {
    if (!claim) {
      return ALL_CLEAR_STATE;
    }

    const channelClaim = getChannelFromClaim(claim);
    const banState = {};

    // This will be replaced once blocking is done at the wallet server level.
    if (blackListedData) {
      if (
        (channelClaim && blackListedData[channelClaim.claim_id || channelClaim.channel_id]) ||
        blackListedData[claim.claim_id]
      ) {
        banState['blacklisted'] = true;
      }
    }

    // We're checking to see if the stream claim_id or signing channel claim_id
    // is in the filter list.
    if (filteredData) {
      if (
        (channelClaim && filteredData[channelClaim.claim_id || channelClaim.channel_id]) ||
        filteredData[claim.claim_id]
      ) {
        banState['filtered'] = true;
      }
    }

    // block stream claims
    // block channel claims if we can't control for them in claim search
    if (mutedChannelUris?.length && channelClaim) {
      if (mutedChannelUris.some((blockedUri) => isURIEqual(blockedUri, channelClaim.permanent_url))) {
        banState['muted'] = true;
      }
    }

    // Commentron blocklist
    if (personalBlocklist.length && channelClaim) {
      if (personalBlocklist.some((blockedUri) => isURIEqual(blockedUri, channelClaim.permanent_url))) {
        banState['blocked'] = true;
      }
    }

    return Object.keys(banState).length === 0 ? ALL_CLEAR_STATE : banState;
  }
)((state, uri) => String(uri));
