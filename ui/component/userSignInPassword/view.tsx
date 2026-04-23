import { SITE_NAME } from 'config';
import React, { useState } from 'react';
import { FormField, Form } from 'component/common/form';
import Button from 'component/button';
import Card from 'component/common/card';
import Nag from 'component/nag';
import UserPasswordReset from 'component/userPasswordReset';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectEmailToVerify, selectEmailNewErrorMessage, selectEmailNewIsPending } from 'redux/selectors/user';
import { doUserSignIn, doClearEmailEntry } from 'redux/actions/user';

type Props = {
  onHandleEmailOnly: () => void;
};

export default function UserSignInPassword(props: Props) {
  const { onHandleEmailOnly } = props;
  const dispatch = useAppDispatch();
  const emailToVerify = useAppSelector(selectEmailToVerify);
  const errorMessage = useAppSelector(selectEmailNewErrorMessage);
  const isPending = useAppSelector(selectEmailNewIsPending);
  const [password, setPassword] = useState('');
  const [forgotPassword, setForgotPassword] = React.useState(false);

  function handleSubmit() {
    if (emailToVerify) {
      dispatch(doUserSignIn(emailToVerify, password));
    }
  }

  function handleChangeToSignIn() {
    onHandleEmailOnly();
  }

  return (
    <div className="main__sign-in">
      {forgotPassword ? (
        <UserPasswordReset />
      ) : (
        <Card
          title={__('Enter your %SITE_NAME% password', {
            SITE_NAME,
          })}
          subtitle={__('Logging in as %email%', {
            email: emailToVerify,
          })}
          actions={
            <Form onSubmit={handleSubmit} className="section">
              <FormField
                autoFocus
                type="password"
                name="sign_in_password"
                id="password"
                autoComplete="on"
                label={__('Password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helper={<Button button="link" label={__('Forgot Password?')} onClick={() => setForgotPassword(true)} />}
              />

              <div className="section__actions">
                <Button button="primary" type="submit" label={__('Continue')} disabled={!password || isPending} />
                <Button button="link" onClick={handleChangeToSignIn} label={__('Use Magic Link')} />
              </div>
            </Form>
          }
          nag={errorMessage && <Nag type="error" relative message={errorMessage} />}
        />
      )}
    </div>
  );
}
