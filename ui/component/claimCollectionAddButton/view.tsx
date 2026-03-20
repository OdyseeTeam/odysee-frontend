import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import React from 'react';
import Button from 'component/button';
import FileActionButton from 'component/common/file-action-button';
import { isClaimAllowedForCollection } from 'util/collections';
type Props = {
  uri: string;
  isShortsPage?: boolean;
  // --- internal ---
  claim: StreamClaim | null | undefined;
  isSaved: boolean;
  doOpenModal: (id: string, arg1: {}) => void;
};

function ClaimCollectionAddButton(props: Props) {
  const { uri, claim, isSaved, isShortsPage, doOpenModal } = props;

  if (!isClaimAllowedForCollection(claim)) {
    return null;
  }

  const label = !isSaved ? __('Save') : __('Saved');

  if (isShortsPage) {
    return (
      <>
        <Button
          className="shorts-page__actions-button"
          title={__('Add this video to a playlist')}
          icon={!isSaved ? ICONS.PLAYLIST_ADD : ICONS.PLAYLIST_FILLED}
          iconSize={16}
          requiresAuth
          onClick={() =>
            doOpenModal(MODALS.COLLECTION_ADD, {
              uri,
            })
          }
        />
        <p>{label}</p>
      </>
    );
  }

  return (
    <FileActionButton
      title={__('Add this video to a playlist')}
      label={label}
      icon={!isSaved ? ICONS.PLAYLIST_ADD : ICONS.PLAYLIST_FILLED}
      iconSize={20}
      requiresAuth
      onClick={() =>
        doOpenModal(MODALS.COLLECTION_ADD, {
          uri,
        })
      }
    />
  );
}

export default ClaimCollectionAddButton;
