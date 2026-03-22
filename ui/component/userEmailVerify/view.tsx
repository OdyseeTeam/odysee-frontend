import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from 'component/button';
import UserSignOutButton from 'component/userSignOutButton';
import I18nMessage from 'component/i18nMessage';
import Card from 'component/common/card';
import { SITE_HELP_EMAIL } from 'config';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doUserResendVerificationEmail, doUserCheckEmailVerified } from 'redux/actions/user';
import {
  selectEmailToVerify,
  selectEmailAlreadyExists,
  selectUser,
  selectResendingVerificationEmail,
  selectUser2FAPending,
} from 'redux/selectors/user';
import { doToast } from 'redux/actions/notifications';

const THIRTY_SECONDS_IN_MS = 30000;

const UserEmailVerify = React.memo(function UserEmailVerify() {
  const dispatch = useAppDispatch();

  const email = useAppSelector((state) => selectEmailToVerify(state));
  const isReturningUser = useAppSelector((state) => selectEmailAlreadyExists(state));
  const user = useAppSelector((state) => selectUser(state));
  const resendingEmail = useAppSelector((state) => selectResendingVerificationEmail(state));
  const user2FAPending = useAppSelector((state) => selectUser2FAPending(state));

  const resendVerificationEmail = useCallback(
    (emailAddr: string) => dispatch(doUserResendVerificationEmail(emailAddr)),
    [dispatch]
  );
  const checkEmailVerified = useCallback(() => dispatch(doUserCheckEmailVerified()), [dispatch]);
  const toast = useCallback((message: string) => dispatch(doToast({ message })), [dispatch]);

  const [wait, setWait] = useState(false);
  const emailVerifyCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // componentDidMount: start polling for email verification
  useEffect(() => {
    emailVerifyCheckIntervalRef.current = setInterval(() => {
      checkEmailVerified();
    }, 5000);

    return () => {
      if (emailVerifyCheckIntervalRef.current) {
        clearInterval(emailVerifyCheckIntervalRef.current);
      }
    };
  }, [checkEmailVerified]);

  // componentDidUpdate: clear interval when email is verified
  useEffect(() => {
    if (emailVerifyCheckIntervalRef.current && user && user.has_verified_email) {
      clearInterval(emailVerifyCheckIntervalRef.current);
      emailVerifyCheckIntervalRef.current = null;
    }
  }, [user]);

  const handleResendVerificationEmail = useCallback(() => {
    if (!wait) {
      resendVerificationEmail(email);
      toast(__('New email sent.'));
      setWait(true);
      setTimeout(() => setWait(false), THIRTY_SECONDS_IN_MS);
    } else {
      toast(__('Please wait a bit longer before requesting again.'));
    }
  }, [wait, email, resendVerificationEmail, toast]);

  return (
    <div className="main__sign-up">
      <Card
        title={isReturningUser ? __('Check Your email') : __('Confirm your account')}
        subtitle={
          user2FAPending ? (
            <p>
              {__(
                'Since you have added a Credit Card or Bank to your Odysee account at some point, we just sent an email to %email% for you to confirm your login as required by Stripe (our payment provider). Remember to check other email folders like spam or promotions.',
                {
                  email,
                }
              )}
            </p>
          ) : (
            <p>
              {__(
                'We just sent an email to %email% with a link for you to %verify_text%. Remember to check other email folders like spam or promotions.',
                {
                  email,
                  verify_text: isReturningUser ? __('log in') : __('verify your account'),
                }
              )}
            </p>
          )
        }
        actions={
          <React.Fragment>
            <div className="section__actions">
              <Button
                button="primary"
                label={__('Resend Link')}
                onClick={handleResendVerificationEmail}
                disabled={resendingEmail}
              />
              <UserSignOutButton label={__('Start Over')} />
            </div>
            <p className="help--card-actions">
              <I18nMessage
                tokens={{
                  help_link: <Button button="link" href={`mailto:${SITE_HELP_EMAIL}`} label={`${SITE_HELP_EMAIL}`} />,
                  chat_link: <Button button="link" href="https://chat.odysee.com" label={__('chat')} />,
                }}
              >
                Email %help_link% or join our %chat_link% if you encounter any trouble verifying.
              </I18nMessage>
            </p>
          </React.Fragment>
        }
      />
    </div>
  );
});

export default UserEmailVerify;
