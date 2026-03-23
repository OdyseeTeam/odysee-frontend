import React from 'react';
import * as ICONS from 'constants/icons';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import Icon from 'component/common/icon';
import { useAppSelector } from 'redux/hooks';
import { selectCountForCollectionId, selectCountForCollectionIdNonDeleted } from 'redux/selectors/collections';
type Props = {
  collectionId: string;
};

function CollectionItemCount(props: Props) {
  const { collectionId } = props;
  const collectionCount =
    useAppSelector((state) =>
      collectionId === COLLECTIONS_CONSTS.WATCH_LATER_ID
        ? selectCountForCollectionIdNonDeleted(state, collectionId)
        : selectCountForCollectionId(state, collectionId)
    ) || 0;
  return (
    <div className="collection-counter">
      <Icon icon={ICONS.PLAYLIST} />
      <span>{collectionCount}</span>
    </div>
  );
}

export default CollectionItemCount;
