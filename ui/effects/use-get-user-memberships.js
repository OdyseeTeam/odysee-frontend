// @flow
import { useState, useEffect } from 'react';
import { getChannelFromClaim } from 'util/claim';

export default function useGetUserMemberships(
  shouldFetchUserMemberships: ?boolean,
  arrayOfContentUris: ?Array<string>,
  convertClaimUrlsToIds: any,
  doFetchUserMemberships: (string) => void // fetch membership values and save in redux
) {
  const [fetchedUserClaims, setFetchedUserClaims] = useState([]);

  useEffect(() => {
    if (shouldFetchUserMemberships && arrayOfContentUris && arrayOfContentUris.length > 0) {
      // check against the uris already saved in memory (already fetched)
      const urisToFetch = arrayOfContentUris.filter(
        (uri) => uri && !fetchedUserClaims.includes(uri) && Boolean(convertClaimUrlsToIds[uri])
      );

      if (urisToFetch.length > 0) {
        // convert uris to claimIds
        const claimIds = arrayOfContentUris.map((uri) => {
          const claimUrlsToId = convertClaimUrlsToIds[uri];
          if (claimUrlsToId) {
            const { claim_id: claimId } = getChannelFromClaim(claimUrlsToId) || {};
            return claimId;
          }
        });

        const commaSeparatedStringOfIds = claimIds.join(',');

        // hit membership/check and save it in redux
        if (doFetchUserMemberships) doFetchUserMemberships(commaSeparatedStringOfIds);
        // update fetched uris
        setFetchedUserClaims([...fetchedUserClaims, ...urisToFetch]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrayOfContentUris]);
}
