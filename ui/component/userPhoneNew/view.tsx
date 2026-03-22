import React, { useState, useCallback } from 'react';
import { Form, FormField, Submit } from 'component/common/form';
import Card from 'component/common/card';
import countryData from 'country-data';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectPhoneNewErrorMessage } from 'redux/selectors/user';
import { doUserPhoneNew } from 'redux/actions/user';

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

const countryCodes = countryData.callingCountries.all
  .filter((_) => _.emoji)
  .reduce((acc, cur) => acc.concat(cur.countryCallingCodes.map((_) => ({ ...cur, countryCallingCode: _ }))), [])
  .toSorted((a, b) => {
    if (a.countryCallingCode < b.countryCallingCode) {
      return -1;
    }

    if (a.countryCallingCode > b.countryCallingCode) {
      return 1;
    }

    return 0;
  });

type Props = {
  cancelButton: React.ReactNode;
  isPending: boolean;
};

const UserPhoneNew = React.memo(function UserPhoneNew({ cancelButton, isPending }: Props) {
  const dispatch = useAppDispatch();

  const phoneErrorMessage = useAppSelector((state) => selectPhoneNewErrorMessage(state));

  const addUserPhone = useCallback(
    (phone: string, countryCode: string) => dispatch(doUserPhoneNew(phone, countryCode)),
    [dispatch]
  );

  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');

  const formatPhone = useCallback(
    (value: string) => {
      const formattedNumber = value.replace(/\D/g, '');

      if (countryCode === '+1') {
        if (!formattedNumber) {
          return '';
        } else if (formattedNumber.length < 4) {
          return formattedNumber;
        } else if (formattedNumber.length < 7) {
          return `(${formattedNumber.substring(0, 3)}) ${formattedNumber.substring(3)}`;
        }

        const fullNumber = `(${formattedNumber.substring(0, 3)}) ${formattedNumber.substring(3, 6)}-${formattedNumber.substring(6)}`;
        return fullNumber.length <= 14 ? fullNumber : fullNumber.substring(0, 14);
      }

      return formattedNumber;
    },
    [countryCode]
  );

  const handleChanged = useCallback(
    (event: React.SyntheticEvent<any>) => {
      setPhone(formatPhone(event.target.value));
    },
    [formatPhone]
  );

  const handleSelect = useCallback((event: React.SyntheticEvent<any>) => {
    setCountryCode(event.target.value);
  }, []);

  const handleSubmit = useCallback(() => {
    addUserPhone(phone.replace(/\D/g, ''), countryCode.substring(1));
  }, [addUserPhone, phone, countryCode]);

  return (
    <Card
      title={__('Enter your phone number')}
      subtitle={__(
        'Enter your phone number and we will send you a verification code. We will not share your phone number with third parties.'
      )}
      actions={
        <Form onSubmit={handleSubmit}>
          <fieldset-group class="fieldset-group--smushed">
            <FormField label={__('Country')} type="select" name="country-codes" onChange={handleSelect}>
              {countryCodes.map((country, index) => (
                <option key={index} value={country.countryCallingCode}>
                  {isMac ? country.emoji : `(${country.alpha2})`} {country.countryCallingCode}
                </option>
              ))}
            </FormField>
            <FormField
              type="text"
              label={__('Number')}
              placeholder={countryCode === '+1' ? '(555) 555-5555' : '5555555555'}
              name="phone"
              value={phone}
              error={phoneErrorMessage}
              onChange={handleChanged}
            />
          </fieldset-group>
          <div className="card__actions">
            <Submit label={__('Submit')} disabled={isPending} />
            {cancelButton}
          </div>
        </Form>
      }
    />
  );
});

export default UserPhoneNew;
