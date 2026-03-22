import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import React from 'react';
import FileActionButton from 'component/common/file-action-button';
import { getClaimScheduledState, isClaimPrivate, isClaimUnlisted } from 'util/claim';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doOpenModal } from 'redux/actions/app';
import { selectClaimForUri, selectClaimRepostedAmountForUri } from 'redux/selectors/claims';

type Props = {
  uri: string;
};

function ClaimRepostButton(props: Props) {
  const { uri } = props;
  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const repostedAmount = useAppSelector((state) => selectClaimRepostedAmountForUri(state, uri));
  const ss: ClaimScheduledState = getClaimScheduledState(claim);

  if (ss === 'scheduled') {
    return null;
  }

  if (isClaimUnlisted(claim) || isClaimPrivate(claim)) {
    return null;
  }

  return (
    <FileActionButton
      title={__('Repost this content')}
      label={
        repostedAmount > 1
          ? __(`%repost_total% Reposts`, {
              repost_total: repostedAmount,
            })
          : __('Repost')
      }
      icon={ICONS.REPOST}
      requiresChannel
      onClick={() =>
        dispatch(
          doOpenModal(MODALS.REPOST, {
            uri,
          })
        )
      }
    />
  );
}

export default ClaimRepostButton;
