// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';

type Props = {
  // -- redux --
  collectionCount: number,
  hasEdits: boolean,
};

function CollectionItemCount(props: Props) {
  const { collectionCount = 0, hasEdits } = props;

  return (
    <div className="collection-counter">
      <Icon icon={ICONS.PLAYLIST} />
      <span>{collectionCount}</span>
    </div>
  );
}

export default CollectionItemCount;
