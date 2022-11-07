// @flow
import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import React from 'react';
import Button from 'component/button';

type Props = {
  uri: string,
  // redux
  claimIsMine: boolean,
  hasSupport: boolean,
  doOpenModal: (id: string, {}) => void,
};

function ClaimSupportsLiquidateButton(props: Props) {
  const { uri, claimIsMine, hasSupport, doOpenModal } = props;

  if (!claimIsMine || !hasSupport) return null;

  return (
    <Button
      button="link"
      className="expandable__button"
      icon={ICONS.UNLOCK}
      aria-label={__('Unlock tips')}
      onClick={() => doOpenModal(MODALS.LIQUIDATE_SUPPORTS, { uri })}
    />
  );
}

export default ClaimSupportsLiquidateButton;
