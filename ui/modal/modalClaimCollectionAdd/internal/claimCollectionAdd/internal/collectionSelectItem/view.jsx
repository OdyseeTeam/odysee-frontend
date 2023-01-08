// @flow
import React from 'react';
import { FormField } from 'component/common/form';
import { COL_TYPES } from 'constants/collections';
import { getLocalisedVersionForCollectionName } from 'util/collections'
import Icon from 'component/common/icon';

type Props = {
  icon: string,
  uri: string,
  // -- redux --
  collection: Collection,
  collectionHasClaim: boolean,
  collectionPending: Collection,
  isBuiltin: boolean,
  doPlaylistAddAndAllowPlaying: (params: { uri: string, collectionName: string, collectionId: string }) => void,
};

function CollectionSelectItem(props: Props) {
  const { icon, uri, collection, collectionHasClaim, collectionPending, isBuiltin, doPlaylistAddAndAllowPlaying } = props;
  const name = isBuiltin ? getLocalisedVersionForCollectionName(collection.name) : collection.name;
  const id = collection.id;

  const [checked, setChecked] = React.useState(collectionHasClaim);

  function handleChange() {
    setChecked((prevChecked) => !prevChecked);

    doPlaylistAddAndAllowPlaying({ uri, collectionId: id, collectionName: name });
  }

  if (collection?.type === COL_TYPES.FEATURED_CHANNELS) {
    return null;
  }

  return (
    <li className="collection-select__item">
      <FormField
        checked={checked}
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
