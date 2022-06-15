// @flow
import React from 'react';
import { FormField } from 'component/common/form';
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

  return (
    <li key={key} className="collection-select__item">
      <FormField
        checked={collectionHasClaim}
        disabled={collectionPending}
        icon={icon}
        type="checkbox"
        name={`select-${id}`}
        onChange={() => doCollectionEdit(id, { uris: [uri], remove: collectionHasClaim })}
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
