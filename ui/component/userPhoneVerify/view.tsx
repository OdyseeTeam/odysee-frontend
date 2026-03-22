import React, { useState, useCallback } from 'react';
import Button from 'component/button';
import { Form, FormField, Submit } from 'component/common/form';
import I18nMessage from 'component/i18nMessage';
import Card from 'component/common/card';
import { SITE_HELP_EMAIL } from 'config';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doUserPhoneVerify, doUserPhoneReset } from 'redux/actions/user';
import { selectPhoneToVerify, selectPhoneVerifyErrorMessage, selectUserCountryCode } from 'redux/selectors/user';

const UserPhoneVerify = React.memo(function UserPhoneVerify() {
  const dispatch = useAppDispatch();

  const phone = useAppSelector((state) => selectPhoneToVerify(state));
  const countryCode = useAppSelector((state) => selectUserCountryCode(state));
  const phoneErrorMessage = useAppSelector((state) => selectPhoneVerifyErrorMessage(state));

  const verifyUserPhone = useCallback((code: string) => dispatch(doUserPhoneVerify(code)), [dispatch]);
  const resetPhone = useCallback(() => dispatch(doUserPhoneReset()), [dispatch]);

  const [code, setCode] = useState('');

  const handleCodeChanged = useCallback((event: React.SyntheticEvent<any>) => {
    setCode(String(event.target.value).trim());
  }, []);

  const handleSubmit = useCallback(() => {
    verifyUserPhone(code);
  }, [verifyUserPhone, code]);

  return (
    <Card
      title={__('Enter the verification code')}
      subtitle={
        <>
          {__(`Please enter the verification code sent to +${countryCode}${phone}. Didn't receive it? `)}
          <Button button="link" onClick={resetPhone} label={__('Go back.')} />
        </>
      }
      actions={
        <>
          <Form onSubmit={handleSubmit}>
            <FormField
              type="text"
              name="code"
              placeholder="1234"
              value={code}
              onChange={handleCodeChanged}
              label={__('Verification Code')}
              error={phoneErrorMessage}
              inputButton={<Submit label={__('Verify')} />}
            />
          </Form>
          <p className="help">
            <I18nMessage
              tokens={{
                help_link: <Button button="link" href={`mailto:${SITE_HELP_EMAIL}`} label={`${SITE_HELP_EMAIL}`} />,
                chat_link: <Button button="link" href="https://chat.odysee.com" label={__('chat')} />,
              }}
            >
              Email %help_link% or join our %chat_link% if you encounter any trouble with your code.
            </I18nMessage>
          </p>
        </>
      }
    />
  );
});

export default UserPhoneVerify;
