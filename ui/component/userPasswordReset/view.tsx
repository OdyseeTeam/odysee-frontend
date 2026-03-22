import * as PAGES from 'constants/pages';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from 'component/common/card';
import Spinner from 'component/spinner';
import { Form, FormField } from 'component/common/form';
import { EMAIL_REGEX } from 'constants/email';
import ErrorText from 'component/common/error-text';
import Button from 'component/button';
import Nag from 'component/nag';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import {
  selectPasswordResetSuccess,
  selectPasswordResetIsPending,
  selectPasswordResetError,
  selectEmailToVerify,
} from 'redux/selectors/user';
import { doUserPasswordReset, doClearPasswordEntry, doClearEmailEntry } from 'redux/actions/user';
import { doToast } from 'redux/actions/notifications';

function UserPasswordReset() {
  const dispatch = useAppDispatch();
  const passwordResetSuccess = useAppSelector(selectPasswordResetSuccess);
  const passwordResetPending = useAppSelector(selectPasswordResetIsPending);
  const passwordResetError = useAppSelector(selectPasswordResetError);
  const emailToVerify = useAppSelector(selectEmailToVerify);
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState(emailToVerify || '');
  const valid = email.match(EMAIL_REGEX);
  const restartAtSignInPage = location.pathname === `/$/${PAGES.AUTH_SIGNIN}`;

  function handleSubmit() {
    if (email) {
      dispatch(doUserPasswordReset(email));
    }
  }

  function handleRestart() {
    setEmail('');
    dispatch(doClearPasswordEntry());
    dispatch(doClearEmailEntry());

    if (restartAtSignInPage) {
      navigate(`/$/${PAGES.AUTH_SIGNIN}`);
    } else {
      navigate(-1);
    }
  }

  React.useEffect(() => {
    if (passwordResetSuccess) {
      dispatch(
        doToast({
          message: __('Email sent!'),
        })
      );
    }
  }, [passwordResetSuccess, dispatch]);
  return (
    <section className="main__sign-in">
      <Card
        title={__('Reset your password')}
        actions={
          <div>
            <Form onSubmit={handleSubmit} className="section">
              <FormField
                autoFocus
                disabled={passwordResetSuccess}
                placeholder={__('yourstruly@example.com')}
                type="email"
                name="sign_in_email"
                id="username"
                autoComplete="on"
                label={__('Email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="section__actions">
                <Button
                  button="primary"
                  type="submit"
                  label={passwordResetPending ? __('Resetting') : __('Reset Password')}
                  disabled={!email || !valid || passwordResetPending || passwordResetSuccess}
                />
                <Button button="link" label={__('Cancel')} onClick={handleRestart} />
                {passwordResetPending && <Spinner type="small" />}
              </div>
            </Form>
          </div>
        }
        nag={
          <React.Fragment>
            {passwordResetError && <Nag type="error" relative message={<ErrorText>{passwordResetError}</ErrorText>} />}
            {passwordResetSuccess && (
              <Nag type="helpful" relative message={__('Check your email for a link to reset your password.')} />
            )}
          </React.Fragment>
        }
      />
    </section>
  );
}

export default UserPasswordReset;
