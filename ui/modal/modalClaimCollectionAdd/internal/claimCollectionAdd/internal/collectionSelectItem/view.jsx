// @flow
import React from 'react';
import { FormField } from 'component/common/form';
import { ModalClaimCollectionAddContext } from 'modal/modalClaimCollectionAdd/view';
import Icon from 'component/common/icon';

type Props = {
  icon: string,
  uri: string,
  key: string,
  // -- redux --
  collection: Collection,
  collectionHasClaim: boolean,
  collectionPending: Collection,
  doCollectionEdit: (collectionId: string, params: CollectionEditParams) => void,
};

function CollectionSelectItem(props: Props) {
  const { icon, uri, key, collection, collectionHasClaim, collectionPending, doCollectionEdit } = props;
  const { name, id } = collection;

  const { collectionsAdded, setCollectionsAdded } = React.useContext(ModalClaimCollectionAddContext);

  function handleChange() {
    const itemsToNotify = collectionHasClaim
      ? collectionsAdded.filter((collection) => collection === `"${name}"`)
      : [...collectionsAdded, `"${name}"`];

    setCollectionsAdded([...itemsToNotify]);
    doCollectionEdit(id, { uris: [uri], remove: collectionHasClaim });
  }

  return (
    <li key={key} className="collection-select__item">
      <FormField
        checked={collectionHasClaim}
        disabled={collectionPending}
        icon={icon}
        type="checkbox"
        name={`select-${id}`}
        onChange={handleChange}
        label={
          <span>
            <Icon icon={icon} className={'icon-collection-select'} />
            {`${name}`}
          </span>
        }
      />
    </li>
  );
}

export default CollectionSelectItem;
