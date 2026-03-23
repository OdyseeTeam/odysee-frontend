import React from 'react';
import { FormField } from 'component/common/form';
import { COL_TYPES } from 'constants/collections';
import { getLocalizedNameForCollectionId } from 'util/collections';
import Icon from 'component/common/icon';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectCollectionForId, selectCollectionForIdHasClaimUrl } from 'redux/selectors/collections';
import { selectClaimIsPendingForId } from 'redux/selectors/claims';
import { doPlaylistAddAndAllowPlaying } from 'redux/actions/content';
type Props = {
  icon: string;
  uri: string;
  collectionId: string;
};

function CollectionSelectItem(props: Props) {
  const { icon, uri, collectionId } = props;
  const dispatch = useAppDispatch();
  const collection = useAppSelector((state) => selectCollectionForId(state, collectionId));
  const collectionHasClaim = useAppSelector((state) => selectCollectionForIdHasClaimUrl(state, collectionId, uri));
  const collectionPending = useAppSelector((state) => selectClaimIsPendingForId(state, collectionId));
  const id = collection.id;
  const name = getLocalizedNameForCollectionId(id) || collection.name;

  function handleChange() {
    dispatch(
      doPlaylistAddAndAllowPlaying({
        uri,
        collectionId: id,
        collectionName: name,
      })
    );
  }

  if (collection?.type === COL_TYPES.FEATURED_CHANNELS) {
    return null;
  }

  return (
    <li className="collection-select__item">
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
