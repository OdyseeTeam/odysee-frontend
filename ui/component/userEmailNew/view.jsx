// @flow
import * as PAGES from 'constants/pages';
import { SIMPLE_SITE } from 'config';
import React, { useState } from 'react';
import { FormField, Form } from 'component/common/form';
import Button from 'component/button';
import analytics from 'analytics';
import { EMAIL_REGEX } from 'constants/email';
import I18nMessage from 'component/i18nMessage';
import { useHistory } from 'react-router-dom';
import Card from 'component/common/card';
import ErrorText from 'component/common/error-text';
import Nag from 'component/common/nag';
import classnames from 'classnames';
import LoginGraphic from 'component/loginGraphic';

type Props = {
  errorMessage: ?string,
  emailExists: boolean,
  isPending: boolean,
  syncEnabled: boolean,
  balance: number,
  daemonSettings: { share_usage_data: boolean },
  doSignUp: (string, ?string) => Promise<any>,
  clearEmailEntry: () => void,
  interestedInYoutubSync: boolean,
  doToggleInterestedInYoutubeSync: () => void,
};

function UserEmailNew(props: Props) {
  const {
    errorMessage,
    isPending,
    doSignUp,
    daemonSettings,
    clearEmailEntry,
    emailExists,
    interestedInYoutubSync,
    doToggleInterestedInYoutubeSync,
  } = props;
  const { share_usage_data: shareUsageData } = daemonSettings;
  const { push, location } = useHistory();
  const urlParams = new URLSearchParams(location.search);
  const emailFromUrl = urlParams.get('email');
  const defaultEmail = emailFromUrl ? decodeURIComponent(emailFromUrl) : '';
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [localShareUsageData] = React.useState(false);
  const valid = email.match(EMAIL_REGEX);

  function handleSubmit() {
    doSignUp(email, password === '' ? undefined : password).then(() => {
      analytics.emailProvidedEvent();
    });
  }

  function handleChangeToSignIn(additionalParams) {
    clearEmailEntry();

    let url = `/$/${PAGES.AUTH_SIGNIN}`;
    const urlParams = new URLSearchParams(location.search);

    urlParams.delete('email');
    if (email) {
      urlParams.set('email', encodeURIComponent(email));
    }

    urlParams.delete('email_exists');
    if (emailExists) {
      urlParams.set('email_exists', '1');
    }

    push(`${url}?${urlParams.toString()}`);
  }

  React.useEffect(() => {
    if (emailExists) {
      handleChangeToSignIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailExists]);

  return (
    <div
      className={classnames('main__sign-up', {
        'main__sign-up--graphic': SIMPLE_SITE,
      })}
    >
      <Card
        title={__('Join')}
        actions={
          <>
            <Form onSubmit={handleSubmit} className="section">
              <FormField
                autoFocus
                placeholder={__('yourstruly@example.com')}
                type="email"
                name="sign_up_email"
                label={__('Email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <FormField
                type="password"
                name="sign_in_password"
                label={__('Password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <FormField
                type="checkbox"
                name="youtube_sync_checkbox"
                label={__('Sync my YouTube channel')}
                checked={interestedInYoutubSync}
                onChange={() => doToggleInterestedInYoutubeSync()}
              />

              <div className="section__actions">
                <Button
                  button="primary"
                  type="submit"
                  label={__('Sign Up')}
                  disabled={!email || !password || !valid || (!localShareUsageData && !shareUsageData) || isPending}
                />
                <Button button="link" onClick={handleChangeToSignIn} label={__('Log In')} />
              </div>
              <p className="help--card-actions">
                <I18nMessage
                  tokens={{
                    terms: <Button button="link" href="https://odysee.com/$/tos" label={__('terms')} />,
                  }}
                >
                  By creating an account, you agree to our %terms% and confirm you're over the age of 13.
                </I18nMessage>
              </p>
            </Form>
          </>
        }
        nag={<>{errorMessage && <Nag type="error" relative message={<ErrorText>{errorMessage}</ErrorText>} />}</>}
        secondPane={SIMPLE_SITE && <LoginGraphic />}
      />
    </div>
  );
}

export default UserEmailNew;
