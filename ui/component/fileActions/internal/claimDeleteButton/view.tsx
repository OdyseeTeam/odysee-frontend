import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import React from 'react';
import FileActionButton from 'component/common/file-action-button';
import { useAppDispatch } from 'redux/hooks';
import { doOpenModal } from 'redux/actions/app';

type Props = {
  uri: string;
};

function ClaimDeleteButton(props: Props) {
  const { uri } = props;
  const dispatch = useAppDispatch();
  return (
    <FileActionButton
      title={__('Remove from your library')}
      icon={ICONS.DELETE}
      onClick={() =>
        dispatch(
          doOpenModal(MODALS.CONFIRM_FILE_REMOVE, {
            uri,
          })
        )
      }
    />
  );
}

export default ClaimDeleteButton;
