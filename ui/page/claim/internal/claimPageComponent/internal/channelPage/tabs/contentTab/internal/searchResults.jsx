// @flow
import React from 'react';
import ClaimList from 'component/claimList';
import { DEBOUNCE_WAIT_DURATION_MS, SEARCH_OPTIONS } from 'constants/search';
import * as CS from 'constants/claim_search';
import * as SETTINGS from 'constants/settings';
import { lighthouse } from 'redux/actions/search';

type Props = {
  searchQuery: string,
  claimId: ?string,
  showMature: ?boolean,
  tileLayout: boolean,
  orderBy?: ?string,
  hideShorts?: boolean,
  minDuration?: ?number,
  maxDuration?: ?number,
  maxAspectRatio?: ?string | ?number,
  searchFilterOptions?: {},
  onResults?: (results: ?Array<string>) => void,
  doResolveUris: (Array<string>, boolean) => void,
};

export function SearchResults(props: Props) {
  const {
    searchQuery,
    claimId,
    showMature,
    tileLayout,
    orderBy,
    hideShorts,
    minDuration,
    onResults,
    doResolveUris,
    maxDuration,
    maxAspectRatio,
    searchFilterOptions,
  } = props;

  const SEARCH_PAGE_SIZE = 24;
  const [page, setPage] = React.useState(1);
  const [searchResults, setSearchResults] = React.useState(undefined);
  const [isSearchingState, setIsSearchingState] = React.useState(false);
  const isSearching = React.useRef(false);
  const noMoreResults = React.useRef(false);
  const stringifiedFilterOptions = searchFilterOptions ? JSON.stringify(searchFilterOptions) : '';

  const filterSortBy =
    searchFilterOptions && searchFilterOptions[SEARCH_OPTIONS.SORT]
      ? `&sort_by=${searchFilterOptions[SEARCH_OPTIONS.SORT]}`
      : '';
  const filterTimeFilter =
    searchFilterOptions && searchFilterOptions[SEARCH_OPTIONS.TIME_FILTER]
      ? `&time_filter=${searchFilterOptions[SEARCH_OPTIONS.TIME_FILTER]}`
      : '';
  const filterExact = searchFilterOptions && searchFilterOptions[SEARCH_OPTIONS.EXACT];

  const filterMediaTypes = React.useMemo(() => {
    if (!searchFilterOptions) return '';
    const allTypes = [
      SEARCH_OPTIONS.MEDIA_VIDEO,
      SEARCH_OPTIONS.MEDIA_AUDIO,
      SEARCH_OPTIONS.MEDIA_IMAGE,
      SEARCH_OPTIONS.MEDIA_TEXT,
      SEARCH_OPTIONS.MEDIA_APPLICATION,
    ];
    const enabled = allTypes.filter((t) => searchFilterOptions[t]);
    if (enabled.length === allTypes.length || enabled.length === 0) return '';
    return `&mediaType=${enabled.join(',')}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stringifiedFilterOptions]);

  const filterMinDuration =
    searchFilterOptions && searchFilterOptions[SEARCH_OPTIONS.MIN_DURATION]
      ? Number(searchFilterOptions[SEARCH_OPTIONS.MIN_DURATION]) * 60
      : null;
  const filterMaxDuration =
    searchFilterOptions && searchFilterOptions[SEARCH_OPTIONS.MAX_DURATION]
      ? Number(searchFilterOptions[SEARCH_OPTIONS.MAX_DURATION]) * 60
      : null;

  // Use filter sort if available, otherwise fall back to orderBy prop
  // prettier-ignore
  const sortBy = filterSortBy || (
    !orderBy || orderBy === CS.ORDER_BY_NEW
      ? `&sort_by=${CS.ORDER_BY_NEW_VALUE[0]}`
      : orderBy === CS.ORDER_BY_TOP
        ? `&sort_by=${CS.ORDER_BY_TOP_VALUE[0]}`
        : ``
  );

  const effectiveMinDuration = filterMinDuration || minDuration;
  const effectiveMaxDuration = filterMaxDuration || maxDuration;

  React.useEffect(() => {
    noMoreResults.current = false;
    setSearchResults(null);
    setPage(1);
  }, [searchQuery, sortBy, stringifiedFilterOptions]);

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
      const queryTerm = filterExact ? `"${searchQuery}"` : searchQuery;

      lighthouse
        .search(
          `from=${SEARCH_PAGE_SIZE * (page - 1)}` +
            `&s=${encodeURIComponent(queryTerm)}` +
            `&channel_id=${encodeURIComponent(claimId)}` +
            sortBy +
            `&nsfw=${showMature ? 'true' : 'false'}` +
            (effectiveMinDuration ? `&${SEARCH_OPTIONS.MIN_DURATION}=${effectiveMinDuration}` : '') +
            (effectiveMaxDuration ? `&${SEARCH_OPTIONS.MAX_DURATION}=${effectiveMaxDuration}` : '') +
            `&size=${SEARCH_PAGE_SIZE}` +
            filterMediaTypes +
            filterTimeFilter +
            (maxAspectRatio ? `&${SEARCH_OPTIONS.MAX_ASPECT_RATIO}=${maxAspectRatio}` : '') +
            (hideShorts ? `&${SEARCH_OPTIONS.EXCLUDE_SHORTS}=${'true'}` : '') +
            (hideShorts
              ? `&${SEARCH_OPTIONS.EXCLUDE_SHORTS_ASPECT_RATIO_LTE}=${SETTINGS.SHORTS_ASPECT_RATIO_LTE}`
              : '') +
            (hideShorts ? `&${SEARCH_OPTIONS.EXCLUDE_SHORTS_DURATION_LTE}=${SETTINGS.SHORTS_DURATION_LTE}` : '')
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
  }, [
    searchQuery,
    claimId,
    page,
    showMature,
    doResolveUris,
    sortBy,
    effectiveMinDuration,
    effectiveMaxDuration,
    maxAspectRatio,
    hideShorts,
    filterMediaTypes,
    filterTimeFilter,
    filterExact,
    stringifiedFilterOptions,
  ]);

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
