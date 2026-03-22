import React from 'react';
import ClaimList from 'component/claimList';
import Spinner from 'component/spinner';
import { FETCH_ACTIVE_LIVESTREAMS_MIN_INTERVAL_MS } from 'constants/livestream';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doFetchAllActiveLivestreamsForQuery } from 'redux/actions/livestream';
import { selectFilteredActiveLivestreamUris, selectIsFetchingActiveLivestreams } from 'redux/selectors/livestream';

export default function LivestreamList() {
  const dispatch = useAppDispatch();
  const activeLivestreamUris = useAppSelector(selectFilteredActiveLivestreamUris);
  const fetchingActiveLivestreams = useAppSelector(selectIsFetchingActiveLivestreams);

  React.useEffect(() => {
    dispatch(doFetchAllActiveLivestreamsForQuery());
    // doFetchAllActiveLivestreamsForQuery is currently limited to 5 minutes per fetch as
    // a global default. If we want more frequent updates (say, to update the
    // view count), we can either change that limit, or add a 'force' parameter
    // to doFetchAllActiveLivestreamsForQuery to override selectively.
    const fetchInterval = setInterval(
      () => dispatch(doFetchAllActiveLivestreamsForQuery()),
      FETCH_ACTIVE_LIVESTREAMS_MIN_INTERVAL_MS + 50
    );
    return () => {
      clearInterval(fetchInterval);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
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
