import React from 'react';
import './style.scss';
import ButtonToggle from '../buttonToggle';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectArAccountUpdating, selectArweaveAccountForAddress } from 'redux/selectors/stripe';
import { doUpdateArweaveAddressStatus } from 'redux/actions/stripe';

type Props = {
  address: string;
};

function ButtonToggleAddressActive(props: Props) {
  const { address } = props;

  const dispatch = useAppDispatch();
  const account = useAppSelector((state) => selectArweaveAccountForAddress(state, address));
  const accountUpdating = useAppSelector(selectArAccountUpdating);

  if (account) {
    const handleClick = () => {
      dispatch(doUpdateArweaveAddressStatus(account.id, account.status === 'active' ? 'inactive' : 'active'));
    };

    return <ButtonToggle status={account.status === 'active'} setStatus={handleClick} busy={accountUpdating} />;
  }

  return null;
}

export default ButtonToggleAddressActive;
