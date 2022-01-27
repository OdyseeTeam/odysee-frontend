// @flow
import { useState, useEffect } from 'react';

export default function useGetUserMemberships(
  shouldFetch: ?boolean,
  uris: Array<string>,
  claimsByUri: any,
  doFetchViewCount: (string) => void
) {
  // const [fetchedUris, setFetchedUris] = useState([]);

  useEffect(() => {
    if (shouldFetch && uris && uris.length > 0) {
      // const urisToFetch = uris.filter((uri) => uri && !fetchedUris.includes(uri) && Boolean(claimsByUri[uri]));

      const claimIds = uris.map((uri) => claimsByUri[uri].claim_id);

      doFetchViewCount(claimIds.join(','));

      // if (urisToFetch.length > 0) {
      //
      //   // setFetchedUris([...fetchedUris, ...urisToFetch]);
      // }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uris]);
}
