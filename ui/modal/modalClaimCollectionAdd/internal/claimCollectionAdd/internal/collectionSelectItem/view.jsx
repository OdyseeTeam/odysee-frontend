// @flow
import React from 'react';
import { FormField } from 'component/common/form';
import { COL_TYPES } from 'constants/collections';
import { getLocalizedNameForCollectionId } from 'util/collections';
import Icon from 'component/common/icon';

type Props = {
  icon: string,
  uri: string,
  // -- redux --
  collection: Collection,
  collectionHasClaim: boolean,
  collectionPending: Collection,
  doPlaylistAddAndAllowPlaying: (params: { uri: string, collectionName: string, collectionId: string }) => void,
};

function CollectionSelectItem(props: Props) {
  const { icon, uri, collection, collectionHasClaim, collectionPending, doPlaylistAddAndAllowPlaying } = props;
  const id = collection.id;
  const name = getLocalizedNameForCollectionId(id) || collection.name;

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
