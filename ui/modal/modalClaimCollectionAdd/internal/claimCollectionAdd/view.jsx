// @flow
import React from 'react';
import Button from 'component/button';
import Card from 'component/common/card';
import CollectionSelectItem from './internal/collectionSelectItem';
import FormNewCollection from 'component/formNewCollection';
import * as COLS from 'constants/collections';
import * as ICONS from 'constants/icons';

type Props = {
  builtin: CollectionList,
  published: CollectionList,
  unpublished: CollectionList,
  closeModal: () => void,
  // -- redux --
  uri: string,
};

const ClaimCollectionAdd = (props: Props) => {
  const { builtin, published, unpublished, closeModal, uri } = props;

  const [addNewCollection, setAddNewCollection] = React.useState(false);

  return (
    <Card
      title={__('Save to...')}
      singlePane
      body={
        <ul className="ul--no-style card__body-scrollable">
          {builtin.map(({ id }) => (
            <CollectionSelectItem collectionId={id} uri={uri} key={id} icon={COLS.PLAYLIST_ICONS[id]} />
          ))}
          {unpublished
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(({ id }) => (
              <CollectionSelectItem collectionId={id} uri={uri} key={id} icon={ICONS.LOCK} />
            ))}
          {published
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(({ id }) => (
              <CollectionSelectItem collectionId={id} uri={uri} key={id} icon={ICONS.PLAYLIST} />
            ))}
        </ul>
      }
      actions={
        addNewCollection ? (
          <FormNewCollection uri={uri} closeForm={() => setAddNewCollection(false)} />
        ) : (
          <div className="section__actions">
            <Button button="secondary" label={__('Done')} disabled={addNewCollection} onClick={closeModal} />
            <Button button="link" label={__('New Playlist')} onClick={() => setAddNewCollection(true)} />
          </div>
        )
      }
    />
  );
};

export default ClaimCollectionAdd;
