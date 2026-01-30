// @flow
import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import React from 'react';
import FileActionButton from 'component/common/file-action-button';
import { isClaimAllowedForCollection } from 'util/collections';

type Props = {
  uri: string,
  isShortsPage?: boolean,
  // --- internal ---
  claim: ?StreamClaim,
  isSaved: boolean,
  doOpenModal: (id: string, {}) => void,
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
        <FileActionButton
          className="shorts-page__actions-button"
          title={__('Add this video to a playlist')}
          icon={!isSaved ? ICONS.PLAYLIST_ADD : ICONS.PLAYLIST_FILLED}
          iconSize={16}
          requiresAuth
          onClick={() => doOpenModal(MODALS.COLLECTION_ADD, { uri })}
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
      onClick={() => doOpenModal(MODALS.COLLECTION_ADD, { uri })}
    />
  );
}

export default ClaimCollectionAddButton;
