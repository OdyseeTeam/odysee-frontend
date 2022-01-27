// @flow
import { useState, useEffect } from 'react';

export default function useGetUserMemberships(
  shouldFetchUserMemberships: ?boolean,
  arrayOfContentUris: Array<string>,
  claimsByUri: any,
  doFetchViewCount: (string) => void
) {
  const [fetchedUserClaims, setFetchedUserClaims] = useState([]);

  useEffect(() => {
    if (shouldFetchUserMemberships && arrayOfContentUris && arrayOfContentUris.length > 0) {
      const urisToFetch = arrayOfContentUris.filter((uri) => uri && !fetchedUserClaims.includes(uri) && Boolean(claimsByUri[uri]));

      if (urisToFetch.length > 0) {
        const claimIds = arrayOfContentUris.map((uri) => claimsByUri[uri].claim_id);

        doFetchViewCount(claimIds.join(','));

        setFetchedUserClaims([...fetchedUserClaims, ...urisToFetch]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrayOfContentUris]);
}
