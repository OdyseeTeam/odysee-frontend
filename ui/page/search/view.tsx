import { SIMPLE_SITE } from 'config';
import React, { useEffect } from 'react';
import Lbry from 'lbry';
import { parseURI, isNameValid } from 'util/lbryURI';
import ClaimList from 'component/claimList';
import Page from 'component/page';
import SearchOptions from 'component/searchOptions';
import SearchTopClaim from 'component/searchTopClaim';
import { formatLbryUrlForWeb } from 'util/url';
import { useNavigate } from 'react-router-dom';
import { SEARCH_PAGE_SIZE } from 'constants/search';
import * as SETTINGS from 'constants/settings';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doSearch } from 'redux/actions/search';
import {
  selectIsSearching,
  makeSelectSearchUrisForQuery,
  selectSearchOptions,
  makeSelectHasReachedMaxResultsLength,
} from 'redux/selectors/search';
import { selectClientSetting, selectLanguage, selectShowMatureContent } from 'redux/selectors/settings';
import { getSearchQueryString } from 'util/query-params';

export default function SearchPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const showMature = useAppSelector(selectShowMatureContent);
  const routerSearch = useAppSelector((state) => state.router?.location?.search || '');
  const languageSetting = useAppSelector(selectLanguage);
  const searchInLanguage = useAppSelector((state) => selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE));
  const baseSearchOptions = useAppSelector(selectSearchOptions);
  const isSearching = useAppSelector(selectIsSearching);

  const urlParams = new URLSearchParams(routerSearch);
  let urlQuery = urlParams.get('q') || null;

  if (urlQuery) {
    urlQuery = urlQuery.replace(/^lbry:\/\//i, '').replace(/\//, ' ');
  }

  const searchOptions = {
    ...baseSearchOptions,
    isBackgroundSearch: false,
    nsfw: showMature,
    ...(searchInLanguage
      ? {
          language: languageSetting,
        }
      : {}),
  };

  const query = getSearchQueryString(urlQuery, searchOptions);
  const uris = useAppSelector((state) => makeSelectSearchUrisForQuery(query)(state));
  const hasReachedMaxResultsLength = useAppSelector((state) => makeSelectHasReachedMaxResultsLength(query)(state));

  const [from, setFrom] = React.useState(0);
  const [currentUrlQuery, setCurrentUrlQuery] = React.useState(urlQuery);
  const modifiedUrlQuery = urlQuery && urlQuery.trim().replace(/\s+/g, '').replace(/:/g, '#');
  const uriFromQuery = `lbry://${modifiedUrlQuery}`;
  let streamName;
  let channelName;
  let isValid = true;

  try {
    ({ streamName, channelName } = parseURI(uriFromQuery));

    if (
      (!streamName && !channelName) ||
      (streamName && !isNameValid(streamName)) ||
      (channelName && !isNameValid(channelName))
    ) {
      isValid = false;
    }
  } catch (e) {
    isValid = false;
  }

  let claimId;

  // Navigate directly to a claim if a claim_id is pasted into the search bar
  if (!/\s/.test(urlQuery) && urlQuery?.length === 40) {
    try {
      const dummyUrlForClaimId = `x#${urlQuery}`;
      ({ claimId } = parseURI(dummyUrlForClaimId));
      Lbry.claim_search({
        claim_id: claimId,
      }).then((res) => {
        if (res.items && res.items.length) {
          const claim = res.items[0];
          const url = formatLbryUrlForWeb(claim.canonical_url);
          navigate(url);
        }
      });
    } catch (e) {}
  }

  const stringifiedSearchOptions = JSON.stringify(searchOptions);
  useEffect(() => {
    if (currentUrlQuery) {
      const searchOptions = JSON.parse(stringifiedSearchOptions);
      dispatch(doSearch(currentUrlQuery, { ...searchOptions, from: from }));
    }
  }, [dispatch, currentUrlQuery, stringifiedSearchOptions, from]);
  useEffect(() => {
    resetPage();
    setCurrentUrlQuery(urlQuery);
  }, [urlQuery]);

  function loadMore() {
    if (!isSearching && !hasReachedMaxResultsLength) {
      setFrom(from + SEARCH_PAGE_SIZE);
    }
  }

  function resetPage() {
    setFrom(0);
  }

  return (
    <Page className="searchPage-wrapper">
      <section className="search">
        {urlQuery && isValid && <SearchTopClaim query={modifiedUrlQuery} isSearching={isSearching} />}
        <ClaimList
          uris={uris || []}
          loading={isSearching}
          useLoadingSpinner
          onScrollBottom={loadMore} // 'page' is 1-indexed; It's not the same as 'from', but it just
          // needs to be unique to indicate when a fetch is needed.
          page={from + 1}
          pageSize={SEARCH_PAGE_SIZE}
          header={
            <SearchOptions simple={SIMPLE_SITE} additionalOptions={searchOptions} onSearchOptionsChanged={resetPage} />
          }
        />
        <div className="main--empty help">{__('These search results are provided by Odysee.')}</div>
      </section>
    </Page>
  );
}
