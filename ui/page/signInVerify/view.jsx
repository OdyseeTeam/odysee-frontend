// @flow
import React, { useState } from 'react';
import { withRouter } from 'react-router';
import Page from 'component/page';
import ReCAPTCHA from 'react-google-recaptcha';
import Button from 'component/button';
import { Lbryio } from 'lbryinc';
import I18nMessage from 'component/i18nMessage';
import Card from 'component/common/card';
import Spinner from 'component/spinner';
import { resolveApiMessage } from 'util/api-message';

type Props = {
  history: { push: (string) => void, location: { search: string } },
};

let authenticationCompleted = false;

function SignInVerifyPage(props: Props) {
  const {
    history: { location },
  } = props;

  const [isAuthenticationSuccess, setIsAuthenticationSuccess] = useState(authenticationCompleted);
  const [showCaptchaMessage, setShowCaptchaMessage] = useState(false);
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const urlParams = new URLSearchParams(location.search);
  const authToken = urlParams.get('auth_token');
  const userSubmittedEmail = urlParams.get('email');
  const verificationToken = urlParams.get('verification_token');
  const needsRecaptcha = urlParams.get('needs_recaptcha') === 'true';

  function onAuthError(message) {
    setErrorMsg(message || __('Authentication failure.'));
  }

  React.useEffect(() => {
    if (!authToken || !userSubmittedEmail || !verificationToken) {
      onAuthError(__('Invalid or expired sign-in link.'));
    }
  }, [authToken, userSubmittedEmail, verificationToken]);

  React.useEffect(() => {
    if (!needsRecaptcha && !isAuthenticationSuccess) {
      verifyUser();
    }
  }, []);

  React.useEffect(() => {
    let captchaTimeout;

    if (needsRecaptcha && !captchaLoaded) {
      captchaTimeout = setTimeout(() => {
        setShowCaptchaMessage(true);
      }, 2000);
    }

    return () => {
      if (captchaTimeout) {
        clearTimeout(captchaTimeout);
      }
    };
  }, [needsRecaptcha, captchaLoaded]);

  function onCaptchaChange(value) {
    verifyUser(value);
  }

  function onCaptchaReady() {
    setCaptchaLoaded(true);
  }

  function verifyUser(captchaValue) {
    Lbryio.call('user_email', 'confirm', {
      auth_token: authToken,
      email: userSubmittedEmail,
      verification_token: verificationToken,
      ...(captchaValue ? { recaptcha: captchaValue } : {}),
    })
      .then(() => {
        setIsAuthenticationSuccess(true);
      })
      .catch((e) => {
        onAuthError(
          e.message ? resolveApiMessage(e.message) : __('Invalid captcha response or other authentication error.')
        );
      })
      .finally(() => {
        authenticationCompleted = true;
      });
  }

  if (!needsRecaptcha && authenticationCompleted === false) {
    return (
      <Page authPage noFooter>
        <div className="main--empty">
          <Spinner delayed />
        </div>
      </Page>
    );
  }

  return (
    <Page authPage noFooter>
      <div className="main__sign-up">
        <Card
          title={
            isAuthenticationSuccess ? __('Log in success!') : errorMsg ? __('Authentication failure.') : __('Log in')
          }
          subtitle={
            <React.Fragment>
              <p>
                {isAuthenticationSuccess
                  ? __('You can now close this tab.')
                  : needsRecaptcha
                  ? null
                  : errorMsg
                  ? __(errorMsg)
                  : __('Welcome back! You are automatically being signed in.')}
              </p>
              {showCaptchaMessage && !isAuthenticationSuccess && (
                <p>
                  <I18nMessage
                    tokens={{
                      refresh: (
                        <Button button="link" label={__('refreshing')} onClick={() => window.location.reload()} />
                      ),
                    }}
                  >
                    Not seeing a captcha? Check your ad blocker or try %refresh%.
                  </I18nMessage>
                </p>
              )}
            </React.Fragment>
          }
          actions={
            !isAuthenticationSuccess &&
            needsRecaptcha && (
              <div className="section__actions">
                <ReCAPTCHA
                  sitekey="6LePsJgUAAAAAFTuWOKRLnyoNKhm0HA4C3elrFMG"
                  onChange={onCaptchaChange}
                  asyncScriptOnLoad={onCaptchaReady}
                  onExpired={onAuthError}
                  onErrored={onAuthError}
                />
              </div>
            )
          }
        />
      </div>
    </Page>
  );
}

export default withRouter(SignInVerifyPage);
