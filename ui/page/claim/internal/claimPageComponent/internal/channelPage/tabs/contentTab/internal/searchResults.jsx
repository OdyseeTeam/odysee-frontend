// @flow
import React from 'react';
import ClaimList from 'component/claimList';
import { DEBOUNCE_WAIT_DURATION_MS, SEARCH_OPTIONS } from 'constants/search';
import * as CS from 'constants/claim_search';
import { lighthouse } from 'redux/actions/search';

type Props = {
  searchQuery: string,
  claimId: ?string,
  showMature: ?boolean,
  tileLayout: boolean,
  orderBy?: ?string,
  minDuration?: ?number,
  onResults?: (results: ?Array<string>) => void,
  doResolveUris: (Array<string>, boolean) => void,
};

export function SearchResults(props: Props) {
  const { searchQuery, claimId, showMature, tileLayout, orderBy, minDuration, onResults, doResolveUris } = props;

  const SEARCH_PAGE_SIZE = 24;
  const [page, setPage] = React.useState(1);
  const [searchResults, setSearchResults] = React.useState(undefined);
  const [isSearchingState, setIsSearchingState] = React.useState(false);
  const isSearching = React.useRef(false);
  const noMoreResults = React.useRef(false);
  const sortBy =
    !orderBy || orderBy === CS.ORDER_BY_NEW
      ? `&sort_by=${CS.ORDER_BY_NEW_VALUE[0]}`
      : orderBy === CS.ORDER_BY_TOP
      ? `&sort_by=${CS.ORDER_BY_TOP_VALUE[0]}`
      : ``;

  React.useEffect(() => {
    noMoreResults.current = false;
    setSearchResults(null);
    setPage(1);
  }, [searchQuery, sortBy]);

  React.useEffect(() => {
    if (onResults) {
      onResults(searchResults);
    }
  }, [searchResults, onResults]);

  React.useEffect(() => {
    if (noMoreResults.current) return;
    isSearching.current = true;

    const timer = setTimeout(() => {
      if (searchQuery.trim().length < 3 || !claimId) {
        return setSearchResults(null);
      }

      setIsSearchingState(true);
      lighthouse
        .search(
          `from=${SEARCH_PAGE_SIZE * (page - 1)}` +
            `&s=${encodeURIComponent(searchQuery)}` +
            `&channel_id=${encodeURIComponent(claimId)}` +
            sortBy +
            `&nsfw=${showMature ? 'true' : 'false'}` +
            (minDuration ? `&${SEARCH_OPTIONS.MIN_DURATION}=${minDuration}` : '') +
            `&size=${SEARCH_PAGE_SIZE}`
        )
        .then(({ body: results }) => {
          const urls = results.map(({ name, claimId }) => {
            return `lbry://${name}#${claimId}`;
          });

          // Batch-resolve the urls before calling 'setSearchResults', as the
          // latter will immediately cause the tiles to resolve, ending up
          // calling doResolveUri one by one before the batched one.
          doResolveUris(urls, true);

          // De-dup (LH will return some duplicates) and concat results
          setSearchResults((prev) => (page === 1 ? urls : Array.from(new Set((prev || []).concat(urls)))));
          noMoreResults.current = !urls || urls.length < SEARCH_PAGE_SIZE;
        })
        .catch(() => {
          setPage(1);
          setSearchResults(null);
          noMoreResults.current = false;
        })
        .finally(() => {
          isSearching.current = false;
          setIsSearchingState(false);
        });
    }, DEBOUNCE_WAIT_DURATION_MS);

    return () => clearTimeout(timer);
  }, [searchQuery, claimId, page, showMature, doResolveUris, sortBy, minDuration]);

  if (!searchResults) {
    return null;
  }

  return (
    <ClaimList
      uris={searchResults}
      loading={isSearchingState}
      onScrollBottom={() => setPage((prev) => (noMoreResults.current ? prev : isSearching.current ? prev : prev + 1))}
      page={page}
      pageSize={SEARCH_PAGE_SIZE}
      tileLayout={tileLayout}
      useLoadingSpinner={isSearchingState}
    />
  );
}
