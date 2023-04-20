// @flow
import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import React from 'react';
import FileActionButton from 'component/common/file-action-button';

type Props = {
  uri: string,
  fileAction?: boolean,
  webShareable: boolean,
  collectionId?: string,
  // -- internal --
  isClaimMine: ?boolean,
  isUnlisted: boolean,
  doOpenModal: (id: string, {}) => void,
};

function ClaimShareButton(props: Props) {
  const { uri, fileAction, collectionId, webShareable, isClaimMine, isUnlisted, doOpenModal } = props;

  if (isUnlisted && !isClaimMine) {
    // The only way a non-creator can re-share is by copying the current URL.
    // But can't confirm if that is kosher (might contain malicious stuff from
    // another sharer?). I think should limit to just creator.
    return null;
  }

  return (
    <FileActionButton
      title={__('Share this content')}
      label={__('Share')}
      icon={ICONS.SHARE}
      onClick={() => doOpenModal(MODALS.SOCIAL_SHARE, { uri, webShareable, collectionId })}
      noStyle={!fileAction}
    />
  );
}

export default ClaimShareButton;
