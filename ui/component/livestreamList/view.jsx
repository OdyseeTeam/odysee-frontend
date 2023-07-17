// @flow
import React from 'react';
import ClaimList from 'component/claimList';
import Spinner from 'component/spinner';
import { FETCH_ACTIVE_LIVESTREAMS_MIN_INTERVAL_MS } from 'constants/livestream';

type Props = {
  activeLivestreamUris: ?Array<string>,
  fetchingActiveLivestreams: boolean,
  doFetchAllActiveLivestreamsForQuery: () => void,
};

export default function LivestreamList(props: Props) {
  const { activeLivestreamUris, fetchingActiveLivestreams, doFetchAllActiveLivestreamsForQuery } = props;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  if (fetchingActiveLivestreams) {
    return (
      <div className="main--empty">
        <Spinner delayed />
      </div>
    );
  }

  return <ClaimList uris={activeLivestreamUris} showNoSourceClaims tileLayout />;
}
