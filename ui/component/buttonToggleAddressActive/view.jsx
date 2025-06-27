// @flow
import React from 'react';
import './style.scss';
import ButtonToggle from '../buttonToggle';

type Props = {
  address: string,
  // select
  accountUpdating?: string,
  account: any,
  doUpdateArweaveAddressStatus: (address: string, status: 'active' | 'inactive') => void,
};

function ButtonToggleAddressActive(props: Props) {
  const { accountUpdating, account, doUpdateArweaveAddressStatus } = props;
  if (account) {
    const handleClick = () => {
      doUpdateArweaveAddressStatus(account.id, account.status === 'active' ? 'inactive' : 'active');
    };

    return <ButtonToggle status={account.status === 'active'} setStatus={handleClick} busy={accountUpdating} />;
  }
  return null;
}

export default ButtonToggleAddressActive;
