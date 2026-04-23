import * as MODALS from 'constants/modal_types';
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import React from 'react';
import FileActionButton from 'component/common/file-action-button';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectClaimIsPendingForId } from 'redux/selectors/claims';
import { doOpenModal } from 'redux/actions/app';

type Props = {
  uri: string;
  collectionId: string;
};

function CollectionDeleteButton(props: Props) {
  const { uri, collectionId } = props;
  const dispatch = useAppDispatch();
  const claimIsPending = useAppSelector((state) => selectClaimIsPendingForId(state, collectionId));

  return (
    <FileActionButton
      title={__('Delete Playlist')}
      onClick={() =>
        dispatch(
          doOpenModal(MODALS.COLLECTION_DELETE, {
            uri,
            collectionId,
            redirect: `/$/${PAGES.PLAYLISTS}`,
          })
        )
      }
      icon={ICONS.DELETE}
      iconSize={18}
      description={__('Delete Playlist')}
      disabled={claimIsPending}
    />
  );
}

export default CollectionDeleteButton;
