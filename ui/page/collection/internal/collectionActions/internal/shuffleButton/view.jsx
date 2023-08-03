// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import FileActionButton from 'component/common/file-action-button';

type ButtonProps = {
  collectionId: string,
  // redux
  doEnableCollectionShuffle: (params: { collectionId: string }) => void,
};

const ShuffleButton = (props: ButtonProps) => {
  const { collectionId, doEnableCollectionShuffle } = props;

  return (
    <FileActionButton
      icon={ICONS.SHUFFLE}
      title={__('Play in Shuffle mode')}
      label={__('Shuffle')}
      onClick={() => doEnableCollectionShuffle({ collectionId })}
    />
  );
};

export default ShuffleButton;
