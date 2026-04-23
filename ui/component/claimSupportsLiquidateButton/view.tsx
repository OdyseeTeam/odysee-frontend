import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import React from 'react';
import Button from 'component/button';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doOpenModal } from 'redux/actions/app';
import { selectClaimIsMineForUri, selectClaimHasSupportsForUri } from 'redux/selectors/claims';

type Props = {
  uri: string;
};

function ClaimSupportsLiquidateButton(props: Props) {
  const { uri } = props;
  const dispatch = useAppDispatch();
  const claimIsMine = useAppSelector((state) => selectClaimIsMineForUri(state, uri));
  const hasSupport = useAppSelector((state) => selectClaimHasSupportsForUri(state, uri));

  if (!claimIsMine || !hasSupport) return null;
  return (
    <Button
      button="link"
      className="expandable__button"
      icon={ICONS.UNLOCK}
      aria-label={__('Unlock tips')}
      onClick={() =>
        dispatch(
          doOpenModal(MODALS.LIQUIDATE_SUPPORTS, {
            uri,
          })
        )
      }
    />
  );
}

export default ClaimSupportsLiquidateButton;
