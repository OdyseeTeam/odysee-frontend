import * as ICONS from 'constants/icons';
import React from 'react';
import Button from 'component/button';
import { COL_TYPES } from 'constants/collections';
import { useAppDispatch } from 'redux/hooks';
import { doCollectionEdit } from 'redux/actions/collections';
import { doToast } from 'redux/actions/notifications';

type Props = {
  uri: string;
  collectionId: string;
  focusable: boolean;
};

function ButtonAddToQueue(props: Props) {
  const { uri, collectionId, focusable = true } = props;
  const dispatch = useAppDispatch();

  function handleRemove(e) {
    if (e) e.preventDefault();
    dispatch(
      doToast({
        message: __('Item removed'),
      })
    );
    dispatch(
      doCollectionEdit(collectionId, {
        uris: [uri],
        remove: true,
        type: COL_TYPES.PLAYLIST,
      })
    );
  }

  return (
    <div className="claim-preview__hover-actions third-item">
      <Button
        title={__('Remove')}
        label={__('Remove')}
        className="button--file-action"
        icon={ICONS.DELETE}
        onClick={(e) => handleRemove(e)}
        tabIndex={focusable ? 0 : -1}
      />
    </div>
  );
}

export default ButtonAddToQueue;
