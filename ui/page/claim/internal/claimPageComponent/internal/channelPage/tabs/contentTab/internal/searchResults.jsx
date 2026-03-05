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
  sortByParam?: ?string,
  hideShorts?: boolean,
  minDuration?: ?number,
  maxDuration?: ?number,
  maxAspectRatio?: ?string | ?number,
  contentType?: ?string,
  freshness?: ?string,
  durationParam?: ?string,
  customMinMinutes?: ?number,
  customMaxMinutes?: ?number,
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
    contentType,
    freshness,
    sortByParam,
    durationParam,
    customMinMinutes,
    customMaxMinutes,
  } = props;

  const SEARCH_PAGE_SIZE = 24;
  const [page, setPage] = React.useState(1);
  const [searchResults, setSearchResults] = React.useState(undefined);
  const [isSearchingState, setIsSearchingState] = React.useState(false);
  const isSearching = React.useRef(false);
  const noMoreResults = React.useRef(false);

  // Map contentType from ClaimListDiscover to lighthouse mediaType param
  const mediaTypeParam = React.useMemo(() => {
    if (!contentType || contentType === CS.CONTENT_ALL) return '';
    // Map claim_search file types to lighthouse media types
    const typeMap = {
      [CS.FILE_VIDEO]: SEARCH_OPTIONS.MEDIA_VIDEO,
      [CS.FILE_AUDIO]: SEARCH_OPTIONS.MEDIA_AUDIO,
      [CS.FILE_IMAGE]: SEARCH_OPTIONS.MEDIA_IMAGE,
      [CS.FILE_DOCUMENT]: SEARCH_OPTIONS.MEDIA_TEXT,
      [CS.FILE_BINARY]: SEARCH_OPTIONS.MEDIA_APPLICATION,
      [CS.FILE_MODEL]: SEARCH_OPTIONS.MEDIA_APPLICATION,
    };
    const mapped = typeMap[contentType];
    return mapped ? `&mediaType=${mapped}` : '';
  }, [contentType]);

  // Map freshness to lighthouse time_filter
  const timeFilterParam = React.useMemo(() => {
    if (!freshness || freshness === CS.FRESH_ALL) return '';
    const freshnessMap = {
      [CS.FRESH_DAY]: 'today',
      [CS.FRESH_WEEK]: 'thisweek',
      [CS.FRESH_MONTH]: 'thismonth',
      [CS.FRESH_YEAR]: 'thisyear',
    };
    const mapped = freshnessMap[freshness];
    return mapped ? `&time_filter=${mapped}` : '';
  }, [freshness]);

  // Map duration filter to lighthouse min_duration/max_duration (in seconds)
  const SHORT_DURATION_SECONDS = 240; // 4 minutes
  const LONG_DURATION_SECONDS = 1200; // 20 minutes

  const durationMinParam = React.useMemo(() => {
    if (!durationParam || durationParam === CS.DURATION.ALL) return null;
    if (durationParam === CS.DURATION.SHORT) return null;
    if (durationParam === CS.DURATION.LONG) return LONG_DURATION_SECONDS;
    if (durationParam === CS.DURATION.CUSTOM && customMinMinutes) return customMinMinutes * 60;
    return null;
  }, [durationParam, customMinMinutes]);

  const durationMaxParam = React.useMemo(() => {
    if (!durationParam || durationParam === CS.DURATION.ALL) return null;
    if (durationParam === CS.DURATION.SHORT) return SHORT_DURATION_SECONDS;
    if (durationParam === CS.DURATION.LONG) return null;
    if (durationParam === CS.DURATION.CUSTOM && customMaxMinutes) return customMaxMinutes * 60;
    return null;
  }, [durationParam, customMaxMinutes]);

  // Build sort_by param: handle ascending (oldest first = ^release_time)
  const isOldestFirst = sortByParam === CS.SORT_BY.OLDEST.key;
  const sortBy =
    !orderBy || orderBy === CS.ORDER_BY_NEW
      ? `&sort_by=${isOldestFirst ? '^' : ''}${CS.ORDER_BY_NEW_VALUE[0]}`
      : orderBy === CS.ORDER_BY_TOP
      ? `&sort_by=${CS.ORDER_BY_TOP_VALUE[0]}`
      : ``;

  // Combine prop-based duration (e.g. shorts) with filter-based duration using intersection
  const effectiveMinDuration =
    durationMinParam && minDuration ? Math.max(durationMinParam, minDuration) : durationMinParam || minDuration || null;
  const effectiveMaxDuration =
    durationMaxParam && maxDuration ? Math.min(durationMaxParam, maxDuration) : durationMaxParam || maxDuration || null;

  React.useEffect(() => {
    noMoreResults.current = false;
    setSearchResults(null);
    setPage(1);
  }, [searchQuery, sortBy, mediaTypeParam, timeFilterParam, effectiveMinDuration, effectiveMaxDuration]);

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
            (effectiveMinDuration ? `&${SEARCH_OPTIONS.MIN_DURATION}=${effectiveMinDuration}` : '') +
            (effectiveMaxDuration ? `&${SEARCH_OPTIONS.MAX_DURATION}=${effectiveMaxDuration}` : '') +
            `&size=${SEARCH_PAGE_SIZE}` +
            mediaTypeParam +
            timeFilterParam +
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
    mediaTypeParam,
    timeFilterParam,
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
