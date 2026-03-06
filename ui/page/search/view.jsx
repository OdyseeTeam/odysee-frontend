// @flow
import { SIMPLE_SITE } from 'config';
import React, { useEffect } from 'react';
import Lbry from 'lbry';
import { parseURI, isNameValid } from 'util/lbryURI';
import ClaimList from 'component/claimList';
import Page from 'component/page';
import SearchOptions from 'component/searchOptions';
import SearchTopClaim from 'component/searchTopClaim';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'component/common/tabs';
import { formatLbryUrlForWeb } from 'util/url';
import { useHistory } from 'react-router';
import { SEARCH_PAGE_SIZE } from 'constants/search';
import YouTubeSearchResults from './internal/youtubeResults';

type Props = {
  urlQuery: string,
  source: string,
  searchOptions: SearchOptions,
  search: (string, SearchOptions) => void,
  isSearching: boolean,
  uris: Array<string>,
  isAuthenticated: boolean,
  hasReachedMaxResultsLength: boolean,
};

export default function SearchPage(props: Props) {
  const { urlQuery, source, searchOptions, search, uris, isSearching, hasReachedMaxResultsLength } = props;
  const { push, replace, location } = useHistory();
  const [from, setFrom] = React.useState(0);
  const [currentUrlQuery, setCurrentUrlQuery] = React.useState(urlQuery);
  const activeSource = source === 'youtube' ? 'youtube' : 'odysee';
  const activeTabIndex = activeSource === 'youtube' ? 1 : 0;

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
      Lbry.claim_search({ claim_id: claimId }).then((res) => {
        if (res.items && res.items.length) {
          const claim = res.items[0];
          const url = formatLbryUrlForWeb(claim.canonical_url);
          push(url);
        }
      });
    } catch (e) {}
  }

  const stringifiedSearchOptions = JSON.stringify(searchOptions);

  useEffect(() => {
    if (activeSource === 'odysee' && currentUrlQuery) {
      const searchOptions = JSON.parse(stringifiedSearchOptions);
      search(currentUrlQuery, { ...searchOptions, from: from });
    }
  }, [search, currentUrlQuery, stringifiedSearchOptions, from, activeSource]);

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

  function updateSearchSource(nextSource: 'odysee' | 'youtube') {
    const urlParams = new URLSearchParams(location.search);
    if (nextSource === 'odysee') {
      urlParams.delete('source');
    } else {
      urlParams.set('source', nextSource);
    }

    replace({
      pathname: location.pathname,
      search: urlParams.toString() ? `?${urlParams.toString()}` : '',
    });
  }

  return (
    <Page className="searchPage-wrapper">
      <section className="search">
        <Tabs index={activeTabIndex} onChange={(index) => updateSearchSource(index === 1 ? 'youtube' : 'odysee')}>
          <TabList className="search-page__tabs">
            <Tab>{__('Odysee')}</Tab>
            <Tab>{__('YouTube')}</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              {urlQuery && isValid && <SearchTopClaim query={modifiedUrlQuery} isSearching={isSearching} />}
              <ClaimList
                uris={uris || []}
                loading={isSearching}
                useLoadingSpinner
                onScrollBottom={loadMore}
                page={from + 1}
                pageSize={SEARCH_PAGE_SIZE}
                header={
                  <SearchOptions
                    simple={SIMPLE_SITE}
                    additionalOptions={searchOptions}
                    onSearchOptionsChanged={resetPage}
                  />
                }
              />
              <div className="main--empty help">{__('These search results are provided by Odysee.')}</div>
            </TabPanel>

            <TabPanel>
              <YouTubeSearchResults query={urlQuery || ''} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </section>
    </Page>
  );
}
