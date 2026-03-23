import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormField, Form } from 'component/common/form';
import Button from 'component/button';
import ErrorText from 'component/common/error-text';
import SettingsRow from 'component/settingsRow';
import * as PAGES from 'constants/pages';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectUser, selectPasswordSetSuccess, selectPasswordSetError } from 'redux/selectors/user';
import {
  doUserPasswordSet as doUserPasswordSetAction,
  doClearPasswordEntry as doClearPasswordEntryAction,
} from 'redux/actions/user';
import { doToast as doToastAction } from 'redux/actions/notifications';

export default function SettingAccountPassword() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const passwordSetSuccess = useAppSelector(selectPasswordSetSuccess);
  const passwordSetError = useAppSelector(selectPasswordSetError);
  const doUserPasswordSet = (newPassword: string, oldPassword: string | null | undefined) =>
    dispatch(doUserPasswordSetAction(newPassword, oldPassword));
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const hasPassword = user && user.password_set;
  const navigate = useNavigate();
  const title = hasPassword ? __('Update Your Password') : __('Add A Password');
  const subtitle = hasPassword ? '' : __('You do not currently have a password set.');

  function handleSubmit() {
    doUserPasswordSet(newPassword, oldPassword);
  }

  React.useEffect(() => {
    if (passwordSetSuccess) {
      navigate(-1);
      dispatch(doToastAction({
        message: __('Password updated successfully.'),
      }));
      dispatch(doClearPasswordEntryAction());
      setOldPassword('');
      setNewPassword('');
    }
  }, [passwordSetSuccess, setOldPassword, setNewPassword, dispatch, navigate]);
  return (
    <SettingsRow title={title} subtitle={subtitle} multirow>
      <Form onSubmit={handleSubmit} className="section">
        {hasPassword && (
          <FormField
            type="password"
            name="setting_set_old_password"
            label={__('Old Password')}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        )}
        <FormField
          type="password"
          name="setting_set_new_password"
          label={__('New Password')}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <div className="section__actions">
          <Button button="primary" type="submit" label={__('Set Password')} disabled={!newPassword} />
          {hasPassword ? (
            <Button button="link" label={__('Forgot Password?')} navigate={`/$/${PAGES.AUTH_PASSWORD_RESET}`} />
          ) : (
            <Button button="link" label={__('Cancel')} onClick={() => navigate(-1)} />
          )}
        </div>
      </Form>
      {passwordSetError && (
        <div className="section">
          <ErrorText>{passwordSetError}</ErrorText>
        </div>
      )}
    </SettingsRow>
  );
}
