// @flow
import type { DoFetchClaimListMine } from 'redux/actions/claims';

import './style.scss';
import * as ICONS from 'constants/icons';
import * as FILE_LIST from 'constants/file_list';
import * as SETTINGS from 'constants/settings';
import * as CS from 'constants/claim_search';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router';
import Button from 'component/button';
import ClaimList from 'component/claimList';
import ClaimPreview from 'component/claimPreview';
import ClaimSearchView from 'component/claimSearchView';
import ChannelSelector from 'component/channelSelector';
import Page from 'component/page';
import Icon from 'component/common/icon';
import Paginate from 'component/common/paginate';
import { PAGE_PARAM, PAGE_SIZE_PARAM } from 'constants/claim';
import { SCHEDULED_TAGS, VISIBILITY_TAGS, PURCHASE_TAG, RENTAL_TAG } from 'constants/tags';
import WebUploadList from 'component/webUploadList';
import Spinner from 'component/spinner';
import Yrbl from 'component/yrbl';

import ClaimListHeader from './internal/fileListHeader/index';

type Props = {
  uploadCount: number,
  checkPendingPublishes: () => void,
  doBeginPublish: (PublishType, ?string) => void,
  fetchClaimListMine: DoFetchClaimListMine,
  fetching: boolean,
  urls: Array<string>,
  urlTotal: number,
  isAllMyClaimsFetched: ?boolean,
  hasClaims?: boolean,
  myClaims: Array<Claim>,
  myStreamClaims: Array<Claim>,
  myRepostClaims: Array<Claim>,
  myUnlistedClaims: Array<Claim>,
  myScheduledClaims: Array<Claim>,
  myPaidClaims: Array<Claim>,
  myPaidClaimsLegacy: Array<Claim>,
  history: { replace: (string) => void, push: (string) => void },
  page: number,
  pageSize: number,
  myChannelIds: Array<ClaimId>,
  activeChannel: Claim,
  isFilteringEnabled: boolean,
  sortOption: { key: string, value: string },
  doClearClaimSearch: () => void,
  doSetClientSetting: (string, any, ?boolean) => void,
};

// Avoid prop drilling
export const FileListContext = React.createContext<any>();

function FileListPublished(props: Props) {
  const {
    uploadCount,
    checkPendingPublishes,
    doBeginPublish,
    fetchClaimListMine,
    fetching,
    urls,
    urlTotal,
    isAllMyClaimsFetched,
    hasClaims,
    myClaims,
    myStreamClaims,
    myRepostClaims,
    myUnlistedClaims,
    myScheduledClaims,
    myPaidClaims,
    myPaidClaimsLegacy,
    page,
    pageSize,
    myChannelIds,
    activeChannel,
    isFilteringEnabled,
    sortOption,
    doClearClaimSearch,
    doSetClientSetting,
  } = props;

  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);

  const [isAllSelected, setIsAllSelected] = React.useState(true);

  const [isLoadingLong, setIsLoadingLong] = React.useState(false);

  const sortByParam = Object.keys(FILE_LIST.SORT_VALUES).find((key) => urlParams.get(key));
  const memoizedSortOption = React.useMemo(() => {
    return sortByParam ? { key: sortByParam, value: urlParams.get(sortByParam) } : sortOption;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption, sortByParam]);
  const defaultFilterType = urlParams.get(FILE_LIST.FILTER_TYPE_KEY) || 'All';
  const defaultSearchTerm = urlParams.get(FILE_LIST.SEARCH_TERM_KEY) || '';

  const [filterType, setFilterType] = React.useState(defaultFilterType);
  const [searchText, setSearchText] = React.useState(defaultSearchTerm);
  const [filterParamsChanged, setFilterParamsChanged] = React.useState(false);

  const channelIdsClaimSearch = isAllSelected ? myChannelIds : activeChannel?.claim_id ? [activeChannel.claim_id] : [];
  const channelIdsClaimList = React.useMemo(() => {
    return isAllSelected ? [] : activeChannel?.claim_id ? [activeChannel.claim_id] : [];
  }, [isAllSelected, activeChannel]);

  const method =
    [
      FILE_LIST.FILE_TYPE.UNLISTED.key,
      FILE_LIST.FILE_TYPE.SCHEDULED.key,
      FILE_LIST.FILE_TYPE.PAID.key,
      FILE_LIST.FILE_TYPE.PAID_LEGACY.key,
    ].includes(filterType) && !isFilteringEnabled
      ? FILE_LIST.METHOD.CLAIM_SEARCH
      : FILE_LIST.METHOD.CLAIM_LIST;

  const params = React.useMemo(() => {
    return {
      [PAGE_PARAM]: Number(page),
      [PAGE_SIZE_PARAM]: Number(pageSize),
    };
  }, [page, pageSize]);

  const csOptionsUnlisted: ClaimSearchOptions = React.useMemo(() => {
    return {
      page_size: 20,
      any_tags: [VISIBILITY_TAGS.UNLISTED],
      channel_ids: channelIdsClaimSearch,
      claim_type: ['stream'],
      order_by: ['height'],
      remove_duplicates: true,
    };
  }, [channelIdsClaimSearch]);

  const csOptionsScheduled: ClaimSearchOptions = React.useMemo(() => {
    return {
      page_size: 20,
      any_tags: Object.values(SCHEDULED_TAGS),
      channel_ids: channelIdsClaimSearch,
      claim_type: ['stream'],
      order_by: ['height'],
      remove_duplicates: true,
      release_time: `>${Math.floor(Date.now() / 1000)}`,
    };
  }, [channelIdsClaimSearch]);

  const csOptionsPaid: ClaimSearchOptions = React.useMemo(() => {
    return {
      page_size: 20,
      any_tags: [PURCHASE_TAG, RENTAL_TAG],
      channel_ids: channelIdsClaimSearch,
      claim_type: ['stream'],
      order_by: ['height'],
      remove_duplicates: true,
    };
  }, [channelIdsClaimSearch]);

  const csOptionsPaidLegacy: ClaimSearchOptions = React.useMemo(() => {
    return {
      page_size: 20,
      fee_amount: CS.FEE_AMOUNT_ONLY_PAID,
      channel_ids: channelIdsClaimSearch,
      claim_type: ['stream'],
      order_by: ['height'],
      remove_duplicates: true,
    };
  }, [channelIdsClaimSearch]);

  const csOptions = {
    [FILE_LIST.FILE_TYPE.UNLISTED.key]: csOptionsUnlisted,
    [FILE_LIST.FILE_TYPE.SCHEDULED.key]: csOptionsScheduled,
    [FILE_LIST.FILE_TYPE.PAID.key]: csOptionsPaid,
    [FILE_LIST.FILE_TYPE.PAID_LEGACY.key]: csOptionsPaidLegacy,
  };

  const claimsToShow = React.useMemo(() => {
    if (!isFilteringEnabled) {
      return [];
    }
    let claims;
    switch (filterType) {
      case FILE_LIST.FILE_TYPE.ALL.key:
        claims = myClaims;
        break;
      case FILE_LIST.FILE_TYPE.UPLOADS.key:
        claims = myStreamClaims;
        break;
      case FILE_LIST.FILE_TYPE.REPOSTS.key:
        claims = myRepostClaims;
        break;
      case FILE_LIST.FILE_TYPE.UNLISTED.key:
        claims = myUnlistedClaims;
        break;
      case FILE_LIST.FILE_TYPE.SCHEDULED.key:
        claims = myScheduledClaims;
        break;
      case FILE_LIST.FILE_TYPE.PAID.key:
        claims = myPaidClaims;
        break;
      case FILE_LIST.FILE_TYPE.PAID_LEGACY.key:
        claims = myPaidClaimsLegacy;
        break;
      default:
        claims = [];
        break;
    }
    return claims;
  }, [
    myClaims,
    myStreamClaims,
    myRepostClaims,
    myUnlistedClaims,
    myScheduledClaims,
    myPaidClaims,
    myPaidClaimsLegacy,
    filterType,
    isFilteringEnabled,
  ]);

  const filteredClaims = React.useMemo(() => {
    if (!isFilteringEnabled) {
      return [];
    }
    let result = claimsToShow;

    // Filter by channel
    if (!isAllSelected && activeChannel) {
      result = result.filter((claim) => {
        // $FlowFixMe
        return claim.signing_channel?.claim_id === activeChannel.claim_id;
      });
    }

    // First handle search
    if (searchText) {
      result = result.filter((claim) => {
        const contentClaim = claim.reposted_claim ? claim.reposted_claim : claim;
        // $FlowFixMe
        return contentClaim.value?.title?.toLocaleLowerCase().includes(searchText.toLocaleLowerCase());
      });
    }

    // Then the sorting selected setting
    return result.sort((claimA, claimB) => {
      const nameComparisonClaimA = claimA.reposted_claim ? claimA.reposted_claim : claimA;
      const nameComparisonClaimB = claimB.reposted_claim ? claimB.reposted_claim : claimB;

      let firstComparisonItem =
        memoizedSortOption.value === FILE_LIST.SORT_ORDER.ASC ? nameComparisonClaimA : nameComparisonClaimB;
      let secondComparisonItem =
        memoizedSortOption.value === FILE_LIST.SORT_ORDER.ASC ? nameComparisonClaimB : nameComparisonClaimA;
      const comparisonObj = {};

      if (memoizedSortOption.key === FILE_LIST.SORT_KEYS.NAME) {
        const nameComparisonObj = {
          a: firstComparisonItem.value?.title || firstComparisonItem.name,
          b: secondComparisonItem.value?.title || secondComparisonItem.name,
        };

        Object.assign(comparisonObj, nameComparisonObj);

        // Only name (string) has a different return than when sorting numbers
        // $FlowFixMe
        return comparisonObj.a.localeCompare(comparisonObj.b, undefined, { numeric: true, sensitivity: 'base' });
      }

      function getComparisonObj() {
        let timestampComparisonObj = {};
        switch (memoizedSortOption.key) {
          case FILE_LIST.SORT_KEYS.RELEASED_AT:
            firstComparisonItem = memoizedSortOption.value === FILE_LIST.SORT_ORDER.DESC ? claimA : claimB;
            secondComparisonItem = memoizedSortOption.value === FILE_LIST.SORT_ORDER.DESC ? claimB : claimA;

            timestampComparisonObj = {
              // $FlowFixMe
              a: firstComparisonItem.value?.release_time || firstComparisonItem.meta.creation_timestamp,
              // $FlowFixMe
              b: secondComparisonItem.value?.release_time || secondComparisonItem.meta.creation_timestamp,
            };

            Object.assign(comparisonObj, timestampComparisonObj);

            break;

          case FILE_LIST.SORT_KEYS.UPDATED_AT:
            firstComparisonItem = memoizedSortOption.value === FILE_LIST.SORT_ORDER.DESC ? claimA : claimB;
            secondComparisonItem = memoizedSortOption.value === FILE_LIST.SORT_ORDER.DESC ? claimB : claimA;

            timestampComparisonObj = {
              a: firstComparisonItem.height > 0 ? firstComparisonItem.height : 999999999999999,
              b: secondComparisonItem.height > 0 ? secondComparisonItem.height : 999999999999999,
            };

            Object.assign(comparisonObj, timestampComparisonObj);

            break;
        }
      }

      getComparisonObj();

      // $FlowFixMe
      if ((comparisonObj.a || 0) > (comparisonObj.b || 0)) {
        return 1;
      }

      // $FlowFixMe
      if ((comparisonObj.a || 0) < (comparisonObj.b || 0)) {
        return -1;
      }

      return 0;
    });
  }, [claimsToShow, searchText, memoizedSortOption, isFilteringEnabled, isAllSelected, activeChannel]);

  const AdvisoryMsg = () => {
    if (filterType === FILE_LIST.FILE_TYPE.UNLISTED.key) {
      return (
        <div className="flp__advisory">
          <Icon icon={ICONS.INFO} />
          <p>
            {__(
              'A special link is required to share unlisted contents. The link can be obtained from "Copy Link" in the context menu, or the "Share" functionality in the file page.'
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  function getClaimListResultsJsx() {
    const startIndex = (page - 1) * Number(pageSize);
    const endIndex = startIndex + Number(pageSize);

    const claimUrls = !isFilteringEnabled
      ? urls
      : filteredClaims.slice(startIndex, endIndex).map((claim) => claim.permanent_url);
    const totalClaims = !isFilteringEnabled ? urlTotal : filteredClaims?.length;
    return (
      <>
        {!!urls && (
          <>
            <ClaimList
              noEmpty
              persistedStorageKey="claim-list-published"
              showHiddenByUser
              uris={fetching ? [] : claimUrls}
              loading={fetching}
            />
            {isLoadingLong && isFilteringEnabled && (
              <div className="main--empty">
                <Spinner type="small" />
                <p>{__('Larger upload list may take time to load with filters enabled')}</p>
              </div>
            )}

            {getFetchingPlaceholders()}
            <Paginate
              totalPages={totalClaims > 0 ? Math.ceil(totalClaims / Number(pageSize)) : 1}
              shouldResetPageNumber={filterParamsChanged}
            />
          </>
        )}
      </>
    );
  }

  function getClaimSearchResultsJsx() {
    const hasChannels = myChannelIds ? myChannelIds.length > 0 : false;

    return hasChannels ? (
      <ClaimSearchView key={filterType} csOptions={csOptions[filterType]} layout="list" pagination="infinite" />
    ) : (
      <Yrbl
        title={__('No uploads')}
        subtitle={__("You haven't uploaded anything yet. This is where you can find them when you do!")}
      />
    );
  }

  function getFetchingPlaceholders() {
    return (
      <>
        {method === FILE_LIST.METHOD.CLAIM_LIST &&
          fetching &&
          new Array(Number(pageSize)).fill(1).map((x, i) => {
            return <ClaimPreview key={i} placeholder="loading" />;
          })}
      </>
    );
  }

  function updateFilteringSetting(isFilteringEnabled, sortOption) {
    const newParams = {
      isFilteringEnabled,
      sortOption,
    };
    doSetClientSetting(SETTINGS.UPLOAD_PAGE_FILTERING, newParams, true);
  }

  useEffect(() => {
    checkPendingPublishes();
  }, [checkPendingPublishes]);

  useEffect(() => {
    if (isFilteringEnabled) {
      return;
    }
    if (method === FILE_LIST.METHOD.CLAIM_LIST) {
      fetchClaimListMine(
        params.page,
        params.page_size,
        true,
        // $FlowFixMe
        Object.values(FILE_LIST.FILE_TYPE)
          // $FlowFixMe
          .find((fileType) => fileType.key === filterType)
          .cmd.split(','),
        true,
        channelIdsClaimList
      );
    } else {
      doClearClaimSearch();
    }
  }, [
    uploadCount,
    params,
    filterType,
    fetchClaimListMine,
    method,
    isFilteringEnabled,
    channelIdsClaimList,
    doClearClaimSearch,
  ]);

  useEffect(() => {
    if (!isFilteringEnabled || isAllMyClaimsFetched) {
      return;
    }
    fetchClaimListMine(1, FILE_LIST.PAGE_SIZE_ALL_ITEMS, true, [], true);
  }, [isFilteringEnabled, isAllMyClaimsFetched, fetchClaimListMine]);

  // Always reset filterParamsChanged for the next render.
  React.useEffect(() => {
    if (filterParamsChanged) {
      setFilterParamsChanged(false);
    }
  }, [filterParamsChanged]);

  React.useEffect(() => {
    let timeout;
    setIsLoadingLong(false);
    if (fetching === true) {
      timeout = setTimeout(() => setIsLoadingLong(true), 7500);
    }
    return () => clearTimeout(timeout);
  }, [fetching]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page>
      <div className="card-stack">
        {!!myChannelIds?.length && myChannelIds?.length > 1 && (
          <ChannelSelector
            hideAnon
            allOptionProps={{ onSelectAll: () => setIsAllSelected(true), isSelected: isAllSelected }}
            onChannelSelect={() => setIsAllSelected(false)}
          />
        )}
        <WebUploadList />
        <FileListContext.Provider
          value={{
            searchText,
            setSearchText,
            isFilteringEnabled,
            sortOption: memoizedSortOption,
            updateFilteringSetting,
            fetching,
            method,
            isAllSelected,
            params,
            channelIdsClaimList,
            setFilterParamsChanged,
          }}
        >
          <ClaimListHeader filterType={filterType} setFilterType={setFilterType} />
        </FileListContext.Provider>
        <AdvisoryMsg />
        {method === FILE_LIST.METHOD.CLAIM_LIST && getClaimListResultsJsx()}
        {method === FILE_LIST.METHOD.CLAIM_SEARCH && getClaimSearchResultsJsx()}
      </div>
      {!(myClaims && myClaims.length) && method === FILE_LIST.METHOD.CLAIM_LIST && (
        <React.Fragment>
          {!fetching && hasClaims === false ? (
            <section className="main--empty">
              <Yrbl
                title={filterType === FILE_LIST.FILE_TYPE.REPOSTS ? __('No Reposts') : __('No uploads')}
                subtitle={
                  filterType === FILE_LIST.FILE_TYPE.REPOSTS
                    ? __("You haven't reposted anything yet.")
                    : __("You haven't uploaded anything yet. This is where you can find them when you do!")
                }
                actions={
                  filterType !== FILE_LIST.FILE_TYPE.REPOSTS && (
                    <div className="section__actions">
                      <Button
                        button="primary"
                        label={__('Upload Something New')}
                        onClick={() => doBeginPublish('file')}
                      />
                    </div>
                  )
                }
              />
            </section>
          ) : (
            <section className="main--empty">
              <Spinner delayed />
            </section>
          )}
        </React.Fragment>
      )}
    </Page>
  );
}

export default FileListPublished;
