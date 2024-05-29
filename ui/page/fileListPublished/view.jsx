// @flow
import type { DoFetchClaimListMine } from 'redux/actions/claims';

import './style.scss';
import * as ICONS from 'constants/icons';
import * as FILE_LIST from 'constants/fileList';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router';
import Button from 'component/button';
import ClaimList from 'component/claimList';
import ClaimPreview from 'component/claimPreview';
import Page from 'component/page';
import Icon from 'component/common/icon';
import Paginate from 'component/common/paginate';
import WebUploadList from 'component/webUploadList';
import Spinner from 'component/spinner';
import Yrbl from 'component/yrbl';
import usePersistedState from 'effects/use-persisted-state';

import ClaimListHeader from './internal/fileListHeader/index';

type Props = {
  uploadCount: number,
  checkPendingPublishes: () => void,
  doBeginPublish: (PublishType, ?string) => void,
  fetchClaimListMine: DoFetchClaimListMine,
  fetching: boolean,
  myClaims: Array<Claim>,
  myStreamClaims: Array<Claim>,
  myRepostClaims: Array<Claim>,
  myUnlistedClaims: Array<Claim>,
  myScheduledClaims: Array<Claim>,
  history: { replace: (string) => void, push: (string) => void },
  page: number,
  pageSize: number,
  myChannelIds: ?Array<ClaimId>,
};

// Avoid prop drilling
export const FileListContext = React.createContext<any>();

function FileListPublished(props: Props) {
  const {
    checkPendingPublishes,
    doBeginPublish,
    fetchClaimListMine,
    fetching,
    myClaims,
    myStreamClaims,
    myRepostClaims,
    myUnlistedClaims,
    myScheduledClaims,
    page,
    pageSize,
  } = props;

  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);

  const sortByParam = Object.keys(FILE_LIST.SORT_VALUES).find((key) => urlParams.get(key));
  const [persistedOption, setPersistedOption] = usePersistedState('filelist-sort', FILE_LIST.DEFAULT_SORT);
  const defaultSortOption = sortByParam ? { key: sortByParam, value: urlParams.get(sortByParam) } : persistedOption;
  const defaultFilterType = urlParams.get(FILE_LIST.FILTER_TYPE_KEY) || 'All';
  const defaultSearchTerm = urlParams.get(FILE_LIST.SEARCH_TERM_KEY) || '';

  const [filterType, setFilterType] = React.useState(defaultFilterType);
  const [searchText, setSearchText] = React.useState(defaultSearchTerm);
  const [sortOption, setSortOption] = React.useState(defaultSortOption);
  const [filterParamsChanged, setFilterParamsChanged] = React.useState(false);

  const claimsToShow = React.useMemo(() => {
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
      default:
        claims = [];
        break;
    }
    return claims;
  }, [myClaims, myStreamClaims, myRepostClaims, myUnlistedClaims, myScheduledClaims, filterType]);

  const filteredClaims = React.useMemo(() => {
    let result = claimsToShow;

    // First handle search
    if (searchText) {
      result = claimsToShow.filter((claim) => {
        // $FlowFixMe
        return claim.value?.title?.toLocaleLowerCase().includes(searchText.toLocaleLowerCase());
      });
    }

    // Then the sorting selected setting
    return result.sort((claimA, claimB) => {
      let firstComparisonItem = sortOption.value === FILE_LIST.SORT_ORDER.ASC ? claimA : claimB;
      let secondComparisonItem = sortOption.value === FILE_LIST.SORT_ORDER.ASC ? claimB : claimA;
      const comparisonObj = {};

      if (sortOption.key === FILE_LIST.SORT_KEYS.NAME) {
        const nameComparisonObj = {
          a: firstComparisonItem.value?.title || firstComparisonItem.name,
          b: secondComparisonItem.value?.title || secondComparisonItem.name,
        };

        Object.assign(comparisonObj, nameComparisonObj);

        // Only name (string) has a different return than when sorting numbers
        // $FlowFixMe
        return comparisonObj.a.localeCompare(comparisonObj.b);
      }

      function getComparisonObj() {
        let timestampComparisonObj = {};
        switch (sortOption.key) {
          case FILE_LIST.SORT_KEYS.CREATED_AT:
            firstComparisonItem = sortOption.value === FILE_LIST.SORT_ORDER.DESC ? claimA : claimB;
            secondComparisonItem = sortOption.value === FILE_LIST.SORT_ORDER.DESC ? claimB : claimA;

            timestampComparisonObj = {
              // $FlowFixMe
              a: firstComparisonItem.value?.release_time || firstComparisonItem.meta.creation_timestamp,
              // $FlowFixMe
              b: secondComparisonItem.value?.release_time || secondComparisonItem.meta.creation_timestamp,
            };

            Object.assign(comparisonObj, timestampComparisonObj);

            break;

          case FILE_LIST.SORT_KEYS.UPDATED_AT:
            firstComparisonItem = sortOption.value === FILE_LIST.SORT_ORDER.DESC ? claimA : claimB;
            secondComparisonItem = sortOption.value === FILE_LIST.SORT_ORDER.DESC ? claimB : claimA;

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
  }, [claimsToShow, searchText, sortOption]);

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

    const urls = filteredClaims.slice(startIndex, endIndex).map((claim) => claim.permanent_url);
    return (
      <>
        {!!urls && (
          <>
            <ClaimList
              noEmpty
              persistedStorageKey="claim-list-published"
              showHiddenByUser
              uris={fetching ? [] : urls}
              loading={fetching}
            />
            {getFetchingPlaceholders()}
            <Paginate
              totalPages={filteredClaims.length > 0 ? Math.ceil(filteredClaims.length / Number(pageSize)) : 1}
              shouldResetPageNumber={filterParamsChanged}
            />
          </>
        )}
      </>
    );
  }

  function getFetchingPlaceholders() {
    return (
      <>
        {fetching &&
          new Array(Number(pageSize)).fill(1).map((x, i) => {
            return <ClaimPreview key={i} placeholder="loading" />;
          })}
      </>
    );
  }

  useEffect(() => {
    checkPendingPublishes();
  }, [checkPendingPublishes]);

  useEffect(() => {
    fetchClaimListMine(1, 999999, true, [], true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstUpdate = React.useRef(true);
  React.useLayoutEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    setFilterParamsChanged(true);
  }, [searchText, filterType, sortOption]);

  React.useEffect(() => {
    if (filterParamsChanged) {
      setFilterParamsChanged(false);
    }
  }, [filterParamsChanged]);

  React.useEffect(() => {
    setPersistedOption(sortOption);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- (setPersistedOption is custom setState, can ignore)
  }, [sortOption]);

  return (
    <Page>
      <div className="card-stack">
        <WebUploadList />
        <FileListContext.Provider
          value={{
            searchText,
            setSearchText,
            fetching,
          }}
        >
          <ClaimListHeader
            filterType={filterType}
            setFilterType={setFilterType}
            // $FlowFixMe
            sortOption={sortOption}
            setSortOption={setSortOption}
          />
        </FileListContext.Provider>
        <AdvisoryMsg />
        {getClaimListResultsJsx()}
      </div>
      {!(claimsToShow && claimsToShow.length) && (
        <React.Fragment>
          {!fetching ? (
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
