import React from 'react';
import Button from 'component/button';
import Card from 'component/common/card';
import { FormField, Form } from 'component/common/form';
import CollectionSelectItem from './internal/collectionSelectItem';
import FormNewCollection from 'component/formNewCollection';
import * as COLS from 'constants/collections';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Spinner from 'component/spinner';
import { getTitleForCollection } from 'util/collections';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectMyPublishedCollections,
  selectMyUnpublishedCollections,
  selectIsFetchingMyCollections,
} from 'redux/selectors/collections';
import { doFetchCollectionListMine } from 'redux/actions/collections';
type Props = {
  uri: string;
  closeModal: () => void;
};

const ClaimCollectionAdd = (props: Props) => {
  const { uri, closeModal } = props;
  const dispatch = useAppDispatch();
  const published = useAppSelector(selectMyPublishedCollections);
  const unpublished = useAppSelector(selectMyUnpublishedCollections);
  const fetchingMine = useAppSelector(selectIsFetchingMyCollections);
  const [addNewCollection, setAddNewCollection] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');
  React.useEffect(() => {
    if (fetchingMine === undefined) {
      dispatch(doFetchCollectionListMine());
    }
  }, [dispatch, fetchingMine]);
  const normalizedSearchText = searchText.trim().toLowerCase();
  const getCollectionLabel = React.useCallback((collection) => getTitleForCollection(collection) || '', []);

  const matchCollection = React.useCallback(
    (collection) =>
      !normalizedSearchText || String(getCollectionLabel(collection)).toLowerCase().includes(normalizedSearchText),
    [getCollectionLabel, normalizedSearchText]
  );

  const unpublishedCollections = React.useMemo(
    () => Object.values(unpublished) as any as Array<Collection>,
    [unpublished]
  );
  const publishedCollections = React.useMemo(
    () => (published ? (Object.values(published) as any as Array<Collection>) : []),
    [published]
  );
  const playlistRows = React.useMemo(() => {
    const usedIds = new Set<string>();
    const sortCollections = (collections: Array<Collection>) =>
      collections
        .filter((collection) => collection && matchCollection(collection))
        .sort((a, b) => getCollectionLabel(a).localeCompare(getCollectionLabel(b), undefined, { sensitivity: 'base' }));
    const addRow = (rows: Array<{ id: string; icon: string }>, id: string, icon: string) => {
      if (usedIds.has(id)) return rows;
      usedIds.add(id);
      return rows.concat({ id, icon });
    };
    let rows = COLS.BUILTIN_PLAYLISTS.reduce(
      (allRows, id) => addRow(allRows, id, COLS.PLAYLIST_ICONS[id]),
      [] as Array<{ id: string; icon: string }>
    );

    sortCollections(unpublishedCollections).forEach(({ id }) => {
      rows = addRow(rows, id, ICONS.LOCK);
    });
    sortCollections(publishedCollections).forEach(({ id }) => {
      rows = addRow(rows, id, ICONS.PLAYLIST);
    });

    return rows;
  }, [getCollectionLabel, matchCollection, publishedCollections, unpublishedCollections]);

  if (fetchingMine) {
    return (
      <Card
        title={__('Save to...')}
        singlePane
        body={
          <div className="main--empty">
            <Spinner />
          </div>
        }
      />
    );
  }

  return (
    <Card
      title={__('Save to...')}
      className="card--background"
      singlePane
      body={
        <ul className="ul--no-style card__body-scrollable">
          <li className="collection-select__item">
            <Form onSubmit={() => {}} className="wunderbar--inline">
              <Icon icon={ICONS.SEARCH} />
              <FormField
                name="playlist_search"
                className="wunderbar__input--inline"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                type="text"
                placeholder={__('Search playlists')}
              />
            </Form>
          </li>
          {playlistRows.map(({ id, icon }) => (
            <CollectionSelectItem collectionId={id} uri={uri} key={id} icon={icon} />
          ))}
        </ul>
      }
      actions={
        addNewCollection ? (
          <FormNewCollection uri={uri} closeForm={() => setAddNewCollection(false)} />
        ) : (
          <div className="section__actions">
            <Button button="primary" label={__('Done')} disabled={addNewCollection} onClick={closeModal} />
            <Button button="link" label={__('New Playlist')} onClick={() => setAddNewCollection(true)} />
          </div>
        )
      }
    />
  );
};

export default ClaimCollectionAdd;
