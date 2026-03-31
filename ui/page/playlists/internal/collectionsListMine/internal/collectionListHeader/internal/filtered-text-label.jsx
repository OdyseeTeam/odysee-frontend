// @flow
import React from 'react';
import { CollectionsListContext } from 'page/playlists/internal/collectionsListMine/view';

const FilteredTextLabel = () => {
  const { totalLength, searchText, filteredCollectionsLength, isFetchingCollections } =
    React.useContext(CollectionsListContext);

  if (!searchText && !isFetchingCollections) return null;

  return (
    <div className="collection-grid__results-summary">
      {searchText &&
        __(
          filteredCollectionsLength > 1
            ? 'Showing %filtered% results of %total%'
            : 'Showing %filtered% result of %total%',
          {
            filtered: filteredCollectionsLength,
            total: totalLength,
          }
        )}
      {searchText && `${' (' + __('filtered') + ') '}`}
      {isFetchingCollections && __('Loading playlists...')}
    </div>
  );
};

export default FilteredTextLabel;
