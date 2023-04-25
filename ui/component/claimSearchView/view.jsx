/**
 * Generic paginated representation of a `claim_search` call.
 *
 * Client provides the full claim_search options. The component only handles
 * the pagination and API calls.
 *
 * -- Usage note: Please memoize 'csOptions' object --
 *  To keep the props list minimal, ClaimSearchOptions is used, but unstable
 *  object references will cause a re-render, so we have to rely on the client
 *  to memoize the object.
 *
 * -- Usage note: how to change options --
 *  To re-use the same instance but with different csOptions, invalidate the
 *  instance through the React 'key' prop.
 *
 * -- Design note: no handling of csOptions --
 *  This component will not construct the options object; the client is in full
 *  control. This eliminates the need to expose a long list of redundant props,
 *  and also makes the usage (what type of search) clearer from the client side.
 *
 *  [CsOptHelper] can be used to generate common options.
 */

// @flow
import type { Node } from 'react';
import React from 'react';

import './style.scss';
import ClaimList from 'component/claimList';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import Spinner from 'component/spinner';
import debounce from 'util/debounce';

// ****************************************************************************
// ****************************************************************************

export type Props = {|
  csOptions: ClaimSearchOptions,
  pagination?: 'infinite' | 'paged',
  header?: string | Node,
  layout?: 'tile' | 'list',
  noUpperReleaseTimeLimit?: boolean,
|};

type StateProps = {|
  csResults: ?Array<string>,
  csResultsMiscInfo: ?ClaimSearchResultsInfo,
  isFetching: boolean,
|};

type DispatchProps = {|
  doClaimSearch: (options: ClaimSearchOptions, settings?: DoClaimSearchSettings) => void,
|};

// ****************************************************************************
// ****************************************************************************

function ClaimSearchView(props: Props & StateProps & DispatchProps) {
  const {
    csOptions,
    noUpperReleaseTimeLimit,
    pagination = 'infinite',
    header,
    layout = 'tile',
    csResults,
    csResultsMiscInfo,
    isFetching,
    doClaimSearch,
  } = props;

  type ScrollInfo = {
    isFetching: boolean,
    csResults: ?Array<string>,
    hasMorePages: boolean,
  };

  const scrollInfoRef = React.useRef<?ScrollInfo>();
  const containerRef = React.useRef<?HTMLDivElement>(null);
  const [page, setPage] = React.useState(1);

  const csSettings = {
    noUpperReleaseTimeLimit: noUpperReleaseTimeLimit,
  };

  const hasMorePages = React.useMemo(() => {
    if (csResultsMiscInfo && csResultsMiscInfo.page && csResultsMiscInfo.totalPages) {
      return csResultsMiscInfo.page < csResultsMiscInfo.totalPages;
    }
    return false;
  }, [csResultsMiscInfo]);

  function advanceToNextPage() {
    // Using a ref here as a workaround to the stale-closure problem because
    // advanceToNextPage() is used inside the debounced scroll-handler function.
    // We don't want to re-register the handler each time any of the props
    // changed, hence the ref method.
    if (scrollInfoRef.current) {
      const { isFetching, csResults, hasMorePages } = scrollInfoRef.current;
      if (!isFetching) {
        if (csResults && hasMorePages) {
          setPage((prev) => prev + 1);
        }
      }
    }
  }

  const Header = () => {
    if (header) {
      if (typeof header === 'string') {
        return <label className="cs-view__header">{header}</label>;
      } else {
        return header;
      }
    }
    return null;
  };

  const NoResults = () => {
    if (isFetching) {
      return null;
    }

    return (
      <div className="cs-view__no-results" onClick={advanceToNextPage}>
        {csResults === null && <p>{__('Sorry, your request timed out. Try refreshing in a bit.')}</p>}
        {csResults && csResults.length === 0 && <p>{__('No results.')}</p>}
      </div>
    );
  };

  const MoreIndicator = () => {
    if (pagination === 'infinite') {
      return (
        <div className="cs-view__has-more" onClick={advanceToNextPage}>
          {isFetching && <Spinner type="small" />}
          {!isFetching && hasMorePages && <Icon icon={ICONS.DOWN} />}
        </div>
      );
    }
    return null;
  };

  // --------------------------------------------------------------------------

  // Infinite-scroll query
  React.useEffect(() => {
    if (pagination !== 'infinite') {
      return;
    }

    if (csResults === undefined) {
      if (page !== 1) {
        setPage(1); // Covers the case of results purged while we are mounted.
      }
      doClaimSearch({ ...csOptions, page: 1 }, csSettings);
    } else {
      assert(csResultsMiscInfo, 'claimSearchView: previous search info missing', csResultsMiscInfo);
      const prevPage = csResultsMiscInfo && csResultsMiscInfo.page ? csResultsMiscInfo.page : null;
      const pageChanged = prevPage && page !== prevPage;
      if (pageChanged && hasMorePages) {
        doClaimSearch({ ...csOptions, page: page }, csSettings);
      }
    }
  }, [csOptions, csResults, csResultsMiscInfo, csSettings, doClaimSearch, hasMorePages, page, pagination]);

  React.useEffect(() => {
    scrollInfoRef.current = { isFetching, csResults, hasMorePages };
  }, [isFetching, csResults, hasMorePages]);

  React.useEffect(() => {
    const handleScroll = debounce(() => {
      const container = containerRef.current;
      if (container) {
        const containerBottom = container.offsetTop + container.offsetHeight;
        const viewportBottom = window.scrollY + window.innerHeight;
        if (containerBottom <= viewportBottom) {
          advanceToNextPage();
        }
      }
    }, 150);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  // --------------------------------------------------------------------------

  assert(csOptions.page_size, 'Please provide a page_size');

  if (pagination === 'paged') {
    // It's a little tricky to implement given how we are storing result's key
    // using the claim_search query, minus the page. Will require some deeper
    // changes. Coming soon(tm).
    assert(false, 'Paged pagination not supported at the moment');
    return null;
  }

  return (
    <div className="cs-view" ref={containerRef}>
      <Header />
      <ClaimList
        uris={csResults}
        tileLayout={layout === 'tile'}
        showNoSourceClaims={csOptions.has_no_source || undefined}
        noEmpty
      />
      <NoResults />
      <MoreIndicator />
    </div>
  );
}

export default ClaimSearchView;
