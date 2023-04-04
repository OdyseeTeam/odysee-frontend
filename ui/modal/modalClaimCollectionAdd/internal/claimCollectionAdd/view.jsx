// @flow
import React from 'react';
import Button from 'component/button';
import Card from 'component/common/card';
import CollectionSelectItem from './internal/collectionSelectItem';
import FormNewCollection from 'component/formNewCollection';
import * as COLS from 'constants/collections';
import * as ICONS from 'constants/icons';
import Spinner from 'component/spinner';

type Props = {
  uri: string,
  closeModal: () => void,
  // -- redux --
  published: CollectionList,
  unpublished: CollectionList,
  fetchingMine: ?boolean,
  doFetchCollectionListMine: () => void,
};

const ClaimCollectionAdd = (props: Props) => {
  const { uri, closeModal, published, unpublished, fetchingMine, doFetchCollectionListMine } = props;

  const [addNewCollection, setAddNewCollection] = React.useState(false);

  React.useEffect(() => {
    doFetchCollectionListMine();
  }, [doFetchCollectionListMine]);

  if (fetchingMine !== false) {
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
          {COLS.BUILTIN_PLAYLISTS.map((id) => (
            <CollectionSelectItem collectionId={id} uri={uri} key={id} icon={COLS.PLAYLIST_ICONS[id]} />
          ))}
          {Object.values(unpublished)
            // $FlowFixMe
            .sort((a, b) => a.name?.localeCompare(b.name))
            // $FlowFixMe
            .map(({ id }) => (
              <CollectionSelectItem collectionId={id} uri={uri} key={id} icon={ICONS.LOCK} />
            ))}
          {published &&
            Object.values(published)
              // $FlowFixMe
              .sort((a, b) => a.name?.localeCompare(b.name))
              // $FlowFixMe
              .map(({ id }) => <CollectionSelectItem collectionId={id} uri={uri} key={id} icon={ICONS.PLAYLIST} />)}
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
