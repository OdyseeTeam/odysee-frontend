import React from 'react';
import Button from 'component/button';
import { useAppDispatch } from 'redux/hooks';
import { doSignOut } from 'redux/actions/app';
import { doClearEmailEntry, doClearPasswordEntry } from 'redux/actions/user';

type Props = {
  button: string;
  label?: string;
};

function UserSignOutButton(props: Props) {
  const { button = 'link', label } = props;
  const dispatch = useAppDispatch();
  return (
    <Button
      button={button}
      label={label || __('Sign Out')}
      onClick={() => {
        dispatch(doClearPasswordEntry());
        dispatch(doClearEmailEntry());
        dispatch(doSignOut());
      }}
    />
  );
}

export default UserSignOutButton;
