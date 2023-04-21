// @flow
import React from 'react';
import classnames from 'classnames';

import * as COLS from 'constants/collections';

import { useIsMobile } from 'effects/use-screensize';
import { useLocation } from 'react-router';
import { getTitleForCollection } from 'util/collections';

import CollectionPreview from './internal/collectionPreview';
import SectionLabel from './internal/label';
import CollectionListHeader from './internal/collectionListHeader/index';
import Paginate from 'component/common/paginate';
import usePersistedState from 'effects/use-persisted-state';
import PageItemsLabel from './internal/page-items-label';

type Props = {
  // -- redux --
  publishedCollections: CollectionGroup,
  unpublishedCollections: CollectionGroup,
  editedCollections: CollectionGroup,
  updatedCollections: CollectionGroup,
  savedCollections: CollectionGroup,
  savedCollectionIds: ClaimIds,
  collectionsById: { [collectionId: string]: Collection },
  doResolveClaimIds: (collectionIds: ClaimIds) => void,
  doFetchThumbnailClaimsForCollectionIds: (params: { collectionIds: Array<string> }) => void,
};

// Avoid prop drilling
export const CollectionsListContext = React.createContext<any>();

export default function CollectionsListMine(props: Props) {
  const {
    // -- redux --
    publishedCollections,
    unpublishedCollections,
    editedCollections,
    updatedCollections,
    savedCollections,
    savedCollectionIds,
    collectionsById,
    doResolveClaimIds,
    doFetchThumbnailClaimsForCollectionIds,
  } = props;

  const isMobile = useIsMobile();

  const { search } = useLocation();

  const urlParams = new URLSearchParams(search);
  const sortByParam = Object.keys(COLS.SORT_VALUES).find((key) => urlParams.get(key));
  const [persistedOption, setPersistedOption] = usePersistedState('playlist-sort', COLS.DEFAULT_SORT);
  const defaultSortOption = sortByParam ? { key: sortByParam, value: urlParams.get(sortByParam) } : persistedOption;
  const defaultFilterType = urlParams.get(COLS.FILTER_TYPE_KEY) || 'All';
  const defaultSearchTerm = urlParams.get(COLS.SEARCH_TERM_KEY) || '';

  const [filterType, setFilterType] = React.useState(defaultFilterType);
  const [searchText, setSearchText] = React.useState(defaultSearchTerm);
  const [sortOption, setSortOption] = React.useState(defaultSortOption);
  const [filterParamsChanged, setFilterParamsChanged] = React.useState(false);

  const unpublishedCollectionsList = (Object.keys(unpublishedCollections || {}): any);
  const publishedList = (Object.keys(publishedCollections || {}): any);
  const editedList = (Object.keys(editedCollections || {}): any);
  const savedList = (Object.keys(savedCollections || {}): any);

  const collectionsToShow = React.useMemo(() => {
    let collections;
    switch (filterType) {
      case COLS.LIST_TYPE.ALL:
        collections = unpublishedCollectionsList.concat(publishedList).concat(savedList);
        break;
      case COLS.LIST_TYPE.PRIVATE:
        collections = unpublishedCollectionsList;
        break;
      case COLS.LIST_TYPE.PUBLIC:
        collections = publishedList;
        break;
      case COLS.LIST_TYPE.EDITED:
        collections = editedList;
        break;
      case COLS.LIST_TYPE.SAVED:
        collections = savedList;
        break;
      default:
        collections = [];
        break;
    }

    return collections;
  }, [editedList, filterType, publishedList, savedList, unpublishedCollectionsList]);

  const playlistShowCount = isMobile ? COLS.PLAYLIST_SHOW_COUNT.MOBILE : COLS.PLAYLIST_SHOW_COUNT.DEFAULT;
  const page = (collectionsToShow.length > playlistShowCount && Number(urlParams.get('page'))) || 1;
  const firstItemIndexForPage = playlistShowCount * (page - 1);
  const lastItemIndexForPage = playlistShowCount * page;

  const filteredCollections = React.useMemo(() => {
    let result = collectionsToShow;

    // First handle search
    if (searchText) {
      result = collectionsToShow.filter((id) => {
        const collection = collectionsById[id];
        const title = getTitleForCollection(collection) || '';

        return title.toLocaleLowerCase().includes(searchText.toLocaleLowerCase());
      });
    }

    // Then the sorting selected setting
    return result.sort((a, b) => {
      const collectionA = collectionsById[a];
      const collectionB = collectionsById[b];

      if (updatedCollections[a]) {
        Object.assign(collectionA, updatedCollections[a]);
      }
      if (updatedCollections[b]) {
        Object.assign(collectionB, updatedCollections[b]);
      }

      let firstComparisonItem = sortOption.value === COLS.SORT_ORDER.ASC ? collectionA : collectionB;
      let secondComparisonItem = sortOption.value === COLS.SORT_ORDER.ASC ? collectionB : collectionA;
      const comparisonObj = {};

      if (sortOption.key === COLS.SORT_KEYS.NAME) {
        const nameComparisonObj = {
          a: getTitleForCollection(firstComparisonItem) || '',
          b: getTitleForCollection(secondComparisonItem) || '',
        };

        Object.assign(comparisonObj, nameComparisonObj);

        // Only name (string) has a different return than when sorting numbers
        // $FlowFixMe
        return comparisonObj.a.localeCompare(comparisonObj.b);
      }

      function getComparisonObj() {
        switch (sortOption.key) {
          case COLS.SORT_KEYS.UPDATED_AT:
          case COLS.SORT_KEYS.CREATED_AT:
            firstComparisonItem = sortOption.value === COLS.SORT_ORDER.DESC ? collectionA : collectionB;
            secondComparisonItem = sortOption.value === COLS.SORT_ORDER.DESC ? collectionB : collectionA;

            const timestampComparisonObj = {
              a: firstComparisonItem[sortOption.key],
              b: secondComparisonItem[sortOption.key],
            };

            Object.assign(comparisonObj, timestampComparisonObj);

            break;

          case COLS.SORT_KEYS.COUNT:
            const countComparisonObj = {
              a: firstComparisonItem.items?.length || 0,
              b: secondComparisonItem.items?.length || 0,
            };

            Object.assign(comparisonObj, countComparisonObj);

            break;

          case COLS.SORT_KEYS.NAME:
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
  }, [collectionsById, collectionsToShow, searchText, sortOption, updatedCollections]);

  const totalLength = collectionsToShow.length;
  const filteredCollectionsLength = filteredCollections.length;
  const totalPages = Math.ceil(filteredCollectionsLength / playlistShowCount);
  const paginatedCollections = React.useMemo(
    () => filteredCollections.slice(totalPages >= page ? firstItemIndexForPage : 0, lastItemIndexForPage),
    [filteredCollections, firstItemIndexForPage, lastItemIndexForPage, page, totalPages]
  );
  const paginatedCollectionsStr = JSON.stringify(paginatedCollections);

  React.useEffect(() => {
    if (savedCollectionIds.length > 0) {
      doResolveClaimIds(savedCollectionIds);
    }
  }, [doResolveClaimIds, savedCollectionIds]);

  React.useEffect(() => {
    const paginatedCollections = JSON.parse(paginatedCollectionsStr);
    if (paginatedCollections.length > 0) {
      doFetchThumbnailClaimsForCollectionIds({
        collectionIds: [...COLS.BUILTIN_PLAYLISTS_NO_QUEUE, ...paginatedCollections],
      });
    }
  }, [doFetchThumbnailClaimsForCollectionIds, paginatedCollectionsStr]);

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
  }, [sortOption]);

  return (
    <>
      <SectionLabel label={__('Your Playlists')} />

      <CollectionsListContext.Provider
        value={{
          searchText,
          setSearchText,
          totalLength,
          filteredCollectionsLength,
        }}
      >
        <CollectionListHeader
          filterType={filterType}
          isTruncated={totalLength > filteredCollectionsLength}
          setFilterType={setFilterType}
          // $FlowFixMe
          sortOption={sortOption}
          setSortOption={setSortOption}
        />
      </CollectionsListContext.Provider>

      {/* Playlists: previews */}
      {filteredCollectionsLength > 0 ? (
        <ul className={classnames('ul--no-style claim-list', { playlists: !isMobile })}>
          {/* !isMobile && <TableHeader /> */}

          {paginatedCollections.map((key) => (
            <CollectionPreview collectionId={key} key={key} />
          ))}

          {totalPages > 1 && (
            <PageItemsLabel
              totalLength={filteredCollectionsLength}
              firstItemIndexForPage={firstItemIndexForPage}
              paginatedCollectionsLength={paginatedCollections.length}
            />
          )}

          <Paginate totalPages={totalPages} shouldResetPageNumber={filterParamsChanged} />
        </ul>
      ) : (
        <div className="empty main--empty">{__('No matching playlists')}</div>
      )}
    </>
  );
}
