import React from "react";
import Button from "component/button";
import Card from "component/common/card";
import { FormField, Form } from "component/common/form";
import CollectionSelectItem from "./internal/collectionSelectItem";
import FormNewCollection from "component/formNewCollection";
import * as COLS from "constants/collections";
import * as ICONS from "constants/icons";
import Icon from "component/common/icon";
import Spinner from "component/spinner";
type Props = {
  uri: string;
  closeModal: () => void;
  // -- redux --
  published: CollectionList;
  unpublished: CollectionList;
  fetchingMine: boolean | null | undefined;
  doFetchCollectionListMine: () => void;
};

const ClaimCollectionAdd = (props: Props) => {
  const {
    uri,
    closeModal,
    published,
    unpublished,
    fetchingMine,
    doFetchCollectionListMine
  } = props;
  const [addNewCollection, setAddNewCollection] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');
  React.useEffect(() => {
    if (fetchingMine === undefined) {
      doFetchCollectionListMine();
    }
  }, [doFetchCollectionListMine, fetchingMine]);
  const normalizedSearchText = searchText.trim().toLowerCase();

  const matchName = name => !normalizedSearchText || String(name || '').toLowerCase().includes(normalizedSearchText);

  const unpublishedCollections = ((Object.values(unpublished) as any) as Array<Collection>);
  const publishedCollections = published ? ((Object.values(published) as any) as Array<Collection>) : [];

  if (fetchingMine !== false) {
    return <Card title={__('Save to...')} singlePane body={<div className="main--empty">
            <Spinner />
          </div>} />;
  }

  return <Card title={__('Save to...')} className="card--background" singlePane body={<ul className="ul--no-style card__body-scrollable">
          <li className="collection-select__item">
            <Form onSubmit={() => {}} className="wunderbar--inline">
              <Icon icon={ICONS.SEARCH} />
              <FormField name="playlist_search" className="wunderbar__input--inline" value={searchText} onChange={e => setSearchText(e.target.value)} type="text" placeholder={__('Search playlists')} />
            </Form>
          </li>
          {COLS.BUILTIN_PLAYLISTS.map(id => <CollectionSelectItem collectionId={id} uri={uri} key={id} icon={COLS.PLAYLIST_ICONS[id]} />)}
          {unpublishedCollections.filter(collection => matchName(collection.name)).sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(({
      id
    }) => <CollectionSelectItem collectionId={id} uri={uri} key={id} icon={ICONS.LOCK} />)}
          {publishedCollections.filter(collection => matchName(collection.name)).sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(({
      id
    }) => <CollectionSelectItem collectionId={id} uri={uri} key={id} icon={ICONS.PLAYLIST} />)}
        </ul>} actions={addNewCollection ? <FormNewCollection uri={uri} closeForm={() => setAddNewCollection(false)} /> : <div className="section__actions">
            <Button button="primary" label={__('Done')} disabled={addNewCollection} onClick={closeModal} />
            <Button button="link" label={__('New Playlist')} onClick={() => setAddNewCollection(true)} />
          </div>} />;
};

export default ClaimCollectionAdd;