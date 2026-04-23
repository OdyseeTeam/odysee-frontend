import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import React from 'react';
import Button from 'component/button';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doOpenModal } from 'redux/actions/app';
import { selectClaimForUri } from 'redux/selectors/claims';

type Props = {
  uri?: string;
  abandonActionCallback: (arg0: any) => void;
  iconSize: number;
};

export default function ClaimAbandonButton(props: Props) {
  const { uri, abandonActionCallback } = props;
  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => (uri ? selectClaimForUri(state, uri) : undefined));
  const { value_type } = claim || {};
  let buttonLabel;

  if (value_type === 'channel') {
    buttonLabel = __('Delete Channel');
  } else if (value_type === 'collection') {
    buttonLabel = __('Delete List');
  } else if (value_type === 'stream') {
    buttonLabel = __('Delete Publish');
  }

  function abandonClaim() {
    dispatch(
      doOpenModal(MODALS.CONFIRM_CLAIM_REVOKE, {
        claim: claim,
        cb: abandonActionCallback,
      })
    );
  }

  return <Button disabled={!claim} label={buttonLabel} button="secondary" icon={ICONS.DELETE} onClick={abandonClaim} />;
}
