// @flow
import React from 'react';
import { CollectionsListContext } from 'page/playlists/internal/collectionsListMine/view';

const FilteredTextLabel = () => {
  const { totalLength, searchText, firstPageIndex, filteredCollectionsLength } = React.useContext(
    CollectionsListContext
  );

  if (searchText) {
    return (
      <div className="collection-grid__results-summary">
        {__(
          filteredCollectionsLength > 1
            ? 'Showing %filtered% results of %total%'
            : 'Showing %filtered% result of %total%',
          {
            filtered: filteredCollectionsLength,
            total: totalLength,
          }
        )}
        {`${' (' + __('filtered') + ') '}`}
      </div>
    );
  }

  return (
    <div className="collection-grid__results-summary">
      {__('Showing from item %initial_page_item% to %last_page_item% of %total% total items', {
        initial_page_item: firstPageIndex + 1,
        last_page_item: firstPageIndex + filteredCollectionsLength,
        total: totalLength,
      })}
    </div>
  );
};

export default FilteredTextLabel;
