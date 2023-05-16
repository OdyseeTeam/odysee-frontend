// @flow
import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import React from 'react';
import FileActionButton from 'component/common/file-action-button';
import { getClaimScheduledState, isClaimPrivate, isClaimUnlisted } from 'util/claim';

type Props = {
  uri: string,
  // --- internal ---
  claim: ?StreamClaim,
  repostedAmount: number,
  doOpenModal: (id: string, {}) => void,
};

function ClaimRepostButton(props: Props) {
  const { uri, claim, repostedAmount, doOpenModal } = props;

  const ss: ClaimScheduledState = getClaimScheduledState(claim);
  if (ss === 'scheduled' || ss === 'started') {
    return null;
  }

  if (isClaimUnlisted(claim) || isClaimPrivate(claim)) {
    return null;
  }

  return (
    <FileActionButton
      title={__('Repost this content')}
      label={repostedAmount > 1 ? __(`%repost_total% Reposts`, { repost_total: repostedAmount }) : __('Repost')}
      icon={ICONS.REPOST}
      requiresChannel
      onClick={() => doOpenModal(MODALS.REPOST, { uri })}
    />
  );
}

export default ClaimRepostButton;
