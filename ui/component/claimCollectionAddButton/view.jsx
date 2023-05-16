// @flow
import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import React from 'react';
import FileActionButton from 'component/common/file-action-button';
import { isClaimAllowedForCollection } from 'util/collections';

type Props = {
  uri: string,
  // --- internal ---
  claim: ?StreamClaim,
  isSaved: boolean,
  doOpenModal: (id: string, {}) => void,
};

function ClaimCollectionAddButton(props: Props) {
  const { uri, claim, isSaved, doOpenModal } = props;

  if (!isClaimAllowedForCollection(claim)) {
    return null;
  }

  return (
    <FileActionButton
      title={__('Add this video to a playlist')}
      label={!isSaved ? __('Save') : __('Saved')}
      icon={!isSaved ? ICONS.PLAYLIST_ADD : ICONS.PLAYLIST_FILLED}
      iconSize={20}
      requiresAuth
      onClick={() => doOpenModal(MODALS.COLLECTION_ADD, { uri })}
    />
  );
}

export default ClaimCollectionAddButton;
