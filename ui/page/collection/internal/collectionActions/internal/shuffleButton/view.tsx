import React from 'react';
import * as ICONS from 'constants/icons';
import FileActionButton from 'component/common/file-action-button';
import { useAppDispatch } from 'redux/hooks';
import { doEnableCollectionShuffle } from 'redux/actions/content';
type ButtonProps = {
  collectionId: string;
};

const ShuffleButton = (props: ButtonProps) => {
  const { collectionId } = props;
  const dispatch = useAppDispatch();
  return (
    <FileActionButton
      icon={ICONS.SHUFFLE}
      title={__('Play in Shuffle mode')}
      label={__('Shuffle')}
      onClick={() =>
        dispatch(
          doEnableCollectionShuffle({
            collectionId,
          })
        )
      }
    />
  );
};

export default ShuffleButton;
