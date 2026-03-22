import * as React from 'react';
import Button from 'component/button';
import NavigationHistoryItem from 'component/navigationHistoryItem';
import Paginate from 'component/common/paginate';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectHistoryPageCount, makeSelectHistoryForPage } from 'redux/selectors/content';
import { doClearContentHistoryUri } from 'redux/actions/content';
import { useLocation } from 'react-router-dom';
type HistoryItem = {
  uri: string;
  lastViewed: number;
};

function UserHistoryPage() {
  const dispatch = useAppDispatch();
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const page = Number(urlParams.get('page')) || 0;

  const pageCount = useAppSelector(selectHistoryPageCount);
  const historyItems: Array<HistoryItem> = useAppSelector(makeSelectHistoryForPage(page)) || [];
  const clearHistoryUri = (uri: string) => dispatch(doClearContentHistoryUri(uri));

  const [itemsSelected, setItemsSelected] = React.useState<Record<string, boolean>>({});

  const onSelect = (uri: string) => {
    const newItemsSelected = { ...itemsSelected };
    if (itemsSelected[uri]) {
      delete newItemsSelected[uri];
    } else {
      newItemsSelected[uri] = true;
    }
    setItemsSelected(newItemsSelected);
  };

  const selectAll = () => {
    const newSelectedState: Record<string, boolean> = {};
    historyItems.forEach(({ uri }) => (newSelectedState[uri] = true));
    setItemsSelected(newSelectedState);
  };

  const unselectAll = () => {
    setItemsSelected({});
  };

  const removeSelected = () => {
    Object.keys(itemsSelected).forEach((uri) => clearHistoryUri(uri));
    setItemsSelected({});
  };

  const allSelected = Object.keys(itemsSelected).length === historyItems.length;
  const selectHandler = allSelected ? unselectAll : selectAll;

  return historyItems.length ? (
    <React.Fragment>
      <div className="card__actions">
        {Object.keys(itemsSelected).length ? (
          <Button button="link" label={__('Delete')} onClick={removeSelected} />
        ) : (
          <span>{/* Using an empty span so spacing stays the same if the button isn't rendered */}</span>
        )}
        <Button button="link" label={allSelected ? __('Cancel') : __('Select All')} onClick={selectHandler} />
      </div>
      {!!historyItems.length && (
        <section className="card  item-list">
          {historyItems.map((item) => (
            <NavigationHistoryItem
              key={item.uri}
              uri={item.uri}
              lastViewed={item.lastViewed}
              selected={!!itemsSelected[item.uri]}
              onSelect={() => {
                onSelect(item.uri);
              }}
            />
          ))}
        </section>
      )}
      <Paginate totalPages={pageCount} />
    </React.Fragment>
  ) : (
    <div className="main--empty">
      <section className="card card--section">
        <h2 className="card__title card__title--deprecated">{__('Your history is empty, what are you doing here?')}</h2>

        <div className="card__actions card__actions--center">
          <Button button="primary" navigate="/" label={__('Explore new content')} />
        </div>
      </section>
    </div>
  );
}

export default UserHistoryPage;
