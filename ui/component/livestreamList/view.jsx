// @flow
import React from 'react';
import ClaimList from 'component/claimList';
import Spinner from 'component/spinner';
import { FETCH_ACTIVE_LIVESTREAMS_MIN_INTERVAL_MS } from 'constants/livestream';
import { getLivestreamUris } from 'util/livestream';

type Props = {
  activeLivestreams: ?ActiveLivestreamInfosById,
  fetchingActiveLivestreams: boolean,
  doFetchAllActiveLivestreamsForQuery: () => void,
};

export default function LivestreamList(props: Props) {
  const { activeLivestreams, fetchingActiveLivestreams, doFetchAllActiveLivestreamsForQuery } = props;
  const livestreamUris = getLivestreamUris(activeLivestreams, null);

  React.useEffect(() => {
    doFetchAllActiveLivestreamsForQuery();

    // doFetchAllActiveLivestreamsForQuery is currently limited to 5 minutes per fetch as
    // a global default. If we want more frequent updates (say, to update the
    // view count), we can either change that limit, or add a 'force' parameter
    // to doFetchAllActiveLivestreamsForQuery to override selectively.
    const fetchInterval = setInterval(
      doFetchAllActiveLivestreamsForQuery,
      FETCH_ACTIVE_LIVESTREAMS_MIN_INTERVAL_MS + 50
    );
    return () => {
      clearInterval(fetchInterval);
    };
  }, []);

  if (fetchingActiveLivestreams) {
    return (
      <div className="main--empty">
        <Spinner delayed />
      </div>
    );
  }

  return <ClaimList uris={livestreamUris} showNoSourceClaims tileLayout />;
}
