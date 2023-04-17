// @flow
import React from 'react';
import { useLocation } from 'react-router-dom';

import { VISIBILITY_TAGS } from 'constants/tags';
import { getChannelIdFromClaim, getClaimTags } from 'util/claim';

/**
 * Checks is there are any visibility restrictions for the given claim.
 *
 * -- Blocker #1: lack of an access key for an unlisted uri. --
 * The key can be provided 2 ways:
 * 1. From 'signature,signature_ts' URLParams.
 * 2. From a cached valid key (from previous verification).
 *
 * @param claim The stream claim being inspected.fdf
 * @param claimIsMine
 * @param uriAccessKey Cached key to evaluate (will skip the verification call).
 * @param verifyClaimSignature Service call to make the verification.
 * @returns {undefined|boolean} undefined = still pending; boolean = true if we need to restrict, false otherwise.
 */
export default function useIsVisibilityRestricted(
  claim: ?Claim,
  claimIsMine: ?boolean,
  uriAccessKey: ?UriAccessKey,
  verifyClaimSignature: (params: VerifyClaimSignatureParams) => Promise<VerifyClaimSignatureResponse>
) {
  const [isRestricted, setIsRestricted] = React.useState(undefined);

  const location = useLocation();

  let accessKey: ?UriAccessKey;
  if (uriAccessKey) {
    accessKey = uriAccessKey;
  } else {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams && searchParams.get('signature') && searchParams.get('signature_ts')) {
      accessKey = {
        // $FlowIgnore (already filtered null)
        signature: searchParams.get('signature'),
        // $FlowIgnore (already filtered null)
        signature_ts: searchParams.get('signature_ts'),
      };
    }
  }

  React.useEffect(() => {
    const verify = async () => {
      if (claim) {
        const tags = getClaimTags(claim);
        if (tags && tags.includes(VISIBILITY_TAGS.UNLISTED)) {
          if (accessKey) {
            return verifyClaimSignature({
              channel_id: getChannelIdFromClaim(claim) || claim.claim_id,
              claim_id: claim.claim_id,
              signature: accessKey.signature,
              signing_ts: accessKey.signature_ts,
            })
              .then((res: VerifyClaimSignatureResponse) => !res.is_valid) // Verification done
              .catch(() => true); // Verification process failed, have to block
          } else {
            return true; // Signature missing
          }
        } else {
          return false; // No tags found (not an unlisted claim)
        }
      } else {
        return claim === null ? false : undefined; // Invalid claim state
      }
    };

    if (claimIsMine || uriAccessKey) {
      setIsRestricted(false);
    } else {
      verify().then((res) => setIsRestricted(res));
    }
  }, [accessKey, claim, claimIsMine, uriAccessKey, verifyClaimSignature]);

  return isRestricted;
}
