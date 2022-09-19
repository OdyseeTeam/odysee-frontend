// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import FileActionButton from 'component/common/file-action-button';

type ButtonProps = {
  collectionId: string,
  // redux
  doToggleShuffleList: (params: { currentUri?: string, collectionId: string, hideToast?: boolean }) => void,
};

const ShuffleButton = (props: ButtonProps) => {
  const { collectionId, doToggleShuffleList } = props;

  return (
    <FileActionButton
      icon={ICONS.SHUFFLE}
      title={__('Play in Shuffle mode')}
      label={__('Shuffle')}
      onClick={() => doToggleShuffleList({ collectionId, hideToast: true, forcePush: true })}
    />
  );
};

export default ShuffleButton;
